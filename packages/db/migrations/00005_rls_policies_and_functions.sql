-- ==============================================================================
-- Storefront Ops: 00005_rls_policies_and_functions.sql
-- Row-Level Security Policies, Permission Matrix Functions, and Performance Indexes
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helper Functions for Supabase Auth Context & Role Checks
-- ------------------------------------------------------------------------------

-- Check if current authenticated user is an active member of the organization
CREATE OR REPLACE FUNCTION is_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM memberships
        WHERE organization_id = p_org_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retrieve role of current authenticated user in organization
CREATE OR REPLACE FUNCTION get_user_role(p_org_id UUID)
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM memberships
    WHERE organization_id = p_org_id
      AND user_id = auth.uid();

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check granular permission per role and module
CREATE OR REPLACE FUNCTION has_permission(
    p_org_id UUID,
    p_module VARCHAR,
    p_action VARCHAR -- view, create, edit, delete, approve
) RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
BEGIN
    v_role := get_user_role(p_org_id);
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Owner/Admin has full access to everything
    IF v_role = 'owner_admin' THEN
        RETURN TRUE;
    END IF;

    -- Viewer is read-only (view only)
    IF v_role = 'viewer' THEN
        RETURN (p_action = 'view');
    END IF;

    -- Module-specific role permissions (Part 2)
    IF p_module = 'finance' THEN
        RETURN (v_role IN ('manager', 'finance'));
    ELSIF p_module = 'orders' THEN
        RETURN (v_role IN ('manager', 'fulfillment', 'support'));
    ELSIF p_module = 'inventory' THEN
        RETURN (v_role IN ('manager', 'fulfillment', 'purchasing'));
    ELSIF p_module = 'purchasing' THEN
        RETURN (v_role IN ('manager', 'purchasing'));
    ELSIF p_module = 'marketing' THEN
        RETURN (v_role IN ('manager', 'marketing'));
    ELSIF p_module = 'support' THEN
        RETURN (v_role IN ('manager', 'support'));
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Row-Level Security Policies for Core Tenant Isolation
-- ------------------------------------------------------------------------------

-- Organizations: Only members can view their organization
CREATE POLICY "org_member_select" ON organizations
    FOR SELECT USING (is_member(id));

-- Products: Tenant isolated
CREATE POLICY "products_tenant_select" ON products
    FOR SELECT USING (is_member(organization_id));
CREATE POLICY "products_tenant_write" ON products
    FOR ALL USING (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'purchasing'));

-- Variants: Tenant isolated
CREATE POLICY "variants_tenant_select" ON variants
    FOR SELECT USING (is_member(organization_id));
CREATE POLICY "variants_tenant_write" ON variants
    FOR ALL USING (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'purchasing'));

-- Orders: Tenant isolated (Support, Fulfillment, Manager, Admin)
CREATE POLICY "orders_tenant_select" ON orders
    FOR SELECT USING (is_member(organization_id));
CREATE POLICY "orders_tenant_update" ON orders
    FOR UPDATE USING (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'fulfillment', 'support'));

-- Payments: Tenant isolated (Finance, Manager, Admin only)
CREATE POLICY "payments_tenant_select" ON payments
    FOR SELECT USING (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'finance'));
CREATE POLICY "payments_tenant_write" ON payments
    FOR ALL USING (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'finance'));

-- Inventory Movements: STRICTLY APPEND-ONLY (Rule 7)
-- Members can select; insert allowed; UPDATE AND DELETE FORBIDDEN FOR ALL ROLES
CREATE POLICY "inventory_movements_select" ON inventory_movements
    FOR SELECT USING (is_member(organization_id));
CREATE POLICY "inventory_movements_insert" ON inventory_movements
    FOR INSERT WITH CHECK (is_member(organization_id) AND get_user_role(organization_id) IN ('owner_admin', 'manager', 'fulfillment', 'purchasing'));
-- Prohibit update and delete completely
CREATE POLICY "inventory_movements_no_update" ON inventory_movements
    FOR UPDATE USING (false);
CREATE POLICY "inventory_movements_no_delete" ON inventory_movements
    FOR DELETE USING (false);

-- Audit Log: Strictly Append-Only & Read-Only for Members
CREATE POLICY "audit_log_select" ON audit_log
    FOR SELECT USING (is_member(organization_id));
CREATE POLICY "audit_log_insert" ON audit_log
    FOR INSERT WITH CHECK (is_member(organization_id));
CREATE POLICY "audit_log_no_update" ON audit_log
    FOR UPDATE USING (false);
CREATE POLICY "audit_log_no_delete" ON audit_log
    FOR DELETE USING (false);

-- ------------------------------------------------------------------------------
-- Strategic Query Indexes
-- ------------------------------------------------------------------------------

-- Foreign key & list filter indexes
CREATE INDEX IF NOT EXISTS idx_orders_org_status_placed ON orders(organization_id, status, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(organization_id, order_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON variants(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_variant ON inventory_levels(organization_id, variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(organization_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(organization_id, created_at DESC);
