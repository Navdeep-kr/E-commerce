-- ==============================================================================
-- Storefront Ops: 00001_initial_schema.sql
-- Foundational Extensions, Core Tenancy, RLS, and Audit Logging
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Migration Tracking Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations (Tenant Boundary)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    reporting_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users (Global User Directory)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization Memberships (RBAC)
CREATE TYPE user_role AS ENUM (
    'owner_admin',
    'manager',
    'fulfillment',
    'purchasing',
    'marketing',
    'support',
    'finance',
    'viewer'
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Stores & Channels
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- shopify, woocommerce, custom
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Warehouses & Stock Locations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_warehouse BOOLEAN NOT NULL DEFAULT TRUE,
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tamper-Evident Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    before_json JSONB,
    after_json JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security on every table (Rule 5)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Record initial migration
INSERT INTO schema_migrations (version) VALUES ('00001_initial_schema') ON CONFLICT DO NOTHING;
-- ==============================================================================
-- Storefront Ops: 00002_catalog_and_inventory.sql
-- Products, Variants, Inventory Levels, Append-Only Movements, Stock Functions
-- ==============================================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vendor VARCHAR(255),
    product_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, draft, archived
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Product Options (e.g. Size, Color)
CREATE TABLE IF NOT EXISTS product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 1,
    values TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Variants
CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    price_minor INT NOT NULL CHECK (price_minor >= 0),
    compare_at_price_minor INT CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= 0),
    cost_minor INT NOT NULL DEFAULT 0 CHECK (cost_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    weight_grams INT DEFAULT 0 CHECK (weight_grams >= 0),
    reorder_point INT NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, sku)
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    is_automated BOOLEAN NOT NULL DEFAULT FALSE,
    rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 1,
    PRIMARY KEY(collection_id, product_id)
);

-- Bins within Warehouses
CREATE TABLE IF NOT EXISTS bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. A-01-03
    zone VARCHAR(50),
    shelf VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, location_id, code)
);

-- Inventory Levels (Aggregated Snapshot: Available = On Hand - Committed)
CREATE TABLE IF NOT EXISTS inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    bin_id UUID REFERENCES bins(id) ON DELETE SET NULL,
    on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    committed INT NOT NULL DEFAULT 0 CHECK (committed >= 0),
    incoming INT NOT NULL DEFAULT 0 CHECK (incoming >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, variant_id, location_id)
);

-- Append-Only Inventory Movements Ledger (Rule 7)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    quantity_delta INT NOT NULL, -- positive = added, negative = deducted
    reason VARCHAR(50) NOT NULL, -- sale, return, damage, loss, found, correction, po_receipt, transfer
    reference_type VARCHAR(50) NOT NULL, -- order, purchase_order, return, manual, transfer
    reference_id VARCHAR(255),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Core Stock Mutation Function: adjust_stock
-- Updates inventory_levels atomically and records an append-only movement row
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_stock(
    p_org_id UUID,
    p_variant_id UUID,
    p_location_id UUID,
    p_delta INT,
    p_reason VARCHAR,
    p_ref_type VARCHAR,
    p_ref_id VARCHAR,
    p_user_id UUID
) RETURNS INT AS $$
DECLARE
    v_new_on_hand INT;
BEGIN
    -- Insert into append-only ledger
    INSERT INTO inventory_movements (
        organization_id, variant_id, location_id, quantity_delta,
        reason, reference_type, reference_id, created_by_user_id, created_at
    ) VALUES (
        p_org_id, p_variant_id, p_location_id, p_delta,
        p_reason, p_ref_type, p_ref_id, p_user_id, NOW()
    );

    -- Upsert inventory level with check on negative on_hand
    INSERT INTO inventory_levels (organization_id, variant_id, location_id, on_hand, committed, incoming, updated_at)
    VALUES (p_org_id, p_variant_id, p_location_id, GREATEST(0, p_delta), 0, 0, NOW())
    ON CONFLICT (organization_id, variant_id, location_id)
    DO UPDATE SET
        on_hand = inventory_levels.on_hand + p_delta,
        updated_at = NOW()
    RETURNING on_hand INTO v_new_on_hand;

    IF v_new_on_hand < 0 THEN
        RAISE EXCEPTION 'Stock adjustment rejected: on_hand would become negative (%)', v_new_on_hand;
    END IF;

    RETURN v_new_on_hand;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- Concurrency-Safe Stock Reservation Function: reserve_stock
-- Uses SELECT ... FOR UPDATE ordered by variant ID to prevent deadlocks and overselling
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reserve_stock(
    p_org_id UUID,
    p_variant_id UUID,
    p_location_id UUID,
    p_quantity INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_on_hand INT;
    v_committed INT;
    v_available INT;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Reservation quantity must be greater than zero: %', p_quantity;
    END IF;

    -- Lock the specific row for update to prevent concurrent race conditions
    SELECT on_hand, committed
    INTO v_on_hand, v_committed
    FROM inventory_levels
    WHERE organization_id = p_org_id
      AND variant_id = p_variant_id
      AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory level record not found for variant % at location %', p_variant_id, p_location_id;
    END IF;

    v_available := v_on_hand - v_committed;

    IF v_available < p_quantity THEN
        RETURN FALSE; -- Cannot reserve: insufficient available stock
    END IF;

    -- Increment committed stock
    UPDATE inventory_levels
    SET committed = committed + p_quantity,
        updated_at = NOW()
    WHERE organization_id = p_org_id
      AND variant_id = p_variant_id
      AND location_id = p_location_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
-- ==============================================================================
-- Storefront Ops: 00003_orders_and_fulfillment.sql
-- Customers, Orders, Payments, Shipments, and Atomic Status Transition Machine
-- ==============================================================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    total_spent_minor INT NOT NULL DEFAULT 0 CHECK (total_spent_minor >= 0),
    orders_count INT NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
    tags TEXT[] DEFAULT '{}',
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, email)
);

-- Addresses (Shipping & Billing)
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL DEFAULT 'shipping', -- shipping, billing
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(100),
    address1 VARCHAR(255) NOT NULL,
    address2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    phone VARCHAR(50),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Status Types
CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'paid',
    'on_hold',
    'ready_to_pack',
    'packing',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'partially_fulfilled'
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(100) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending_payment',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_minor INT NOT NULL CHECK (subtotal_minor >= 0),
    discount_minor INT NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    shipping_minor INT NOT NULL DEFAULT 0 CHECK (shipping_minor >= 0),
    tax_minor INT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
    total_minor INT NOT NULL CHECK (total_minor >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, authorized, paid, partially_refunded, refunded, voided
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'unfulfilled', -- unfulfilled, partially_fulfilled, fulfilled
    risk_level VARCHAR(20) NOT NULL DEFAULT 'low', -- low, medium, high
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(organization_id, order_number)
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    fulfilled_quantity INT NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
    returned_quantity INT NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
    unit_price_minor INT NOT NULL CHECK (unit_price_minor >= 0),
    total_price_minor INT NOT NULL CHECK (total_price_minor >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Activity Timeline / Events
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- status_change, note_added, payment_captured, tracking_updated
    from_status order_status,
    to_status order_status,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
    external_transaction_id VARCHAR(255) NOT NULL,
    amount_minor INT NOT NULL CHECK (amount_minor > 0),
    fee_minor INT NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- authorized, captured, failed, refunded
    fraud_risk_score INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipments & Fulfillment
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(100) NOT NULL,
    service_level VARCHAR(100),
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    label_url TEXT,
    cost_minor INT NOT NULL DEFAULT 0 CHECK (cost_minor >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, shipped, in_transit, out_for_delivery, delivered, exception
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_lines (
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    order_line_id UUID NOT NULL REFERENCES order_lines(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    PRIMARY KEY(shipment_id, order_line_id)
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_lines ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Order State Transition Function: transition_order
-- Validates allowed graph moves and appends an immutable order_events record
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION transition_order(
    p_org_id UUID,
    p_order_id UUID,
    p_to_status order_status,
    p_actor_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS order_status AS $$
DECLARE
    v_current_status order_status;
    v_is_valid BOOLEAN := FALSE;
BEGIN
    SELECT status INTO v_current_status
    FROM orders
    WHERE id = p_order_id AND organization_id = p_org_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found in organization %', p_order_id, p_org_id;
    END IF;

    IF v_current_status = p_to_status THEN
        RETURN v_current_status;
    END IF;

    -- Validate state machine graph
    IF v_current_status = 'pending_payment' AND p_to_status IN ('paid', 'cancelled') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'paid' AND p_to_status IN ('ready_to_pack', 'on_hold', 'cancelled') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'on_hold' AND p_to_status IN ('ready_to_pack', 'cancelled') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'ready_to_pack' AND p_to_status IN ('packing', 'on_hold', 'cancelled') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'packing' AND p_to_status IN ('packed', 'ready_to_pack', 'on_hold') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'packed' AND p_to_status IN ('shipped', 'ready_to_pack') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'shipped' AND p_to_status IN ('delivered', 'returned', 'partially_fulfilled') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'delivered' AND p_to_status IN ('returned') THEN
        v_is_valid := TRUE;
    ELSIF v_current_status = 'partially_fulfilled' AND p_to_status IN ('ready_to_pack', 'shipped', 'cancelled', 'returned') THEN
        v_is_valid := TRUE;
    END IF;

    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Illegal order status transition from % to % for order %',
            v_current_status, p_to_status, p_order_id;
    END IF;

    -- Update order status
    UPDATE orders
    SET status = p_to_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Write atomic event record
    INSERT INTO order_events (
        organization_id, order_id, event_type,
        from_status, to_status, actor_user_id, notes, created_at
    ) VALUES (
        p_org_id, p_order_id, 'status_change',
        v_current_status, p_to_status, p_actor_id, p_notes, NOW()
    );

    RETURN p_to_status;
END;
$$ LANGUAGE plpgsql;
-- ==============================================================================
-- Storefront Ops: 00004_returns_purchasing_support_tasks.sql
-- Returns, Purchasing/Suppliers, Omnichannel Tickets, Marketing, Tasks & Automations
-- ==============================================================================

-- Returns & RMA
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    rma_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'requested', -- requested, approved, received, completed, rejected
    resolution_type VARCHAR(50) NOT NULL, -- refund, store_credit, exchange, repair
    refund_amount_minor INT DEFAULT 0 CHECK (refund_amount_minor >= 0),
    return_label_url TEXT,
    tracking_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, rma_number)
);

CREATE TABLE IF NOT EXISTS return_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    order_line_id UUID NOT NULL REFERENCES order_lines(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason VARCHAR(100) NOT NULL, -- defective, wrong_size, not_as_described, changed_mind
    condition_grade VARCHAR(50), -- grade_a_restock, grade_b_discount, quarantine, dispose
    restocked_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers & Purchasing
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_terms VARCHAR(100), -- net_30, net_60, prepaid
    lead_time_days INT NOT NULL DEFAULT 14 CHECK (lead_time_days >= 0),
    minimum_order_quantity INT NOT NULL DEFAULT 1 CHECK (minimum_order_quantity >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, confirmed, partially_received, received, closed, cancelled
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_minor INT NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
    landed_cost_minor INT NOT NULL DEFAULT 0 CHECK (landed_cost_minor >= 0), -- freight, duties
    total_minor INT NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    expected_delivery_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INT NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost_minor INT NOT NULL CHECK (unit_cost_minor >= 0),
    total_cost_minor INT NOT NULL CHECK (total_cost_minor >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ticket_number VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'email', -- email, chat, form
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, open, pending, solved, closed
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sla_due_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, ticket_number)
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- customer, agent, system
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing Campaigns & Discounts
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- email, sms, meta_ads, google_ads
    budget_minor INT DEFAULT 0 CHECK (budget_minor >= 0),
    spend_minor INT DEFAULT 0 CHECK (spend_minor >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, active, completed
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    discount_type VARCHAR(50) NOT NULL, -- percentage, fixed_amount, free_shipping
    value_minor INT NOT NULL CHECK (value_minor >= 0),
    minimum_subtotal_minor INT DEFAULT 0 CHECK (minimum_subtotal_minor >= 0),
    usage_limit INT,
    times_used INT NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Team Tasks & Workflow Board
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo', -- todo, in_progress, blocked, review, done
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team VARCHAR(50), -- fulfillment, purchasing, support, marketing, finance
    due_date TIMESTAMPTZ,
    linked_entity_type VARCHAR(50), -- order, product, ticket, po
    linked_entity_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved Views & Custom Filters
CREATE TABLE IF NOT EXISTS saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL, -- orders, inventory, tickets, customers
    name VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    sorting JSONB NOT NULL DEFAULT '{}',
    column_visibility JSONB NOT NULL DEFAULT '{}',
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
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
-- Migration 00006: Multi-Tenant Performance Compound Indexes & Keyset Pagination Optimizations
-- Step 19: Eliminates sequential table scans and enables sub-millisecond cursor pagination

-- 1. Orders keyset pagination compound index
CREATE INDEX IF NOT EXISTS idx_orders_org_created_id 
ON orders (organization_id, created_at DESC, id DESC);

-- 2. Orders status filtering index
CREATE INDEX IF NOT EXISTS idx_orders_org_status 
ON orders (organization_id, status);

-- 3. Inventory SKU rapid balance lookup index
CREATE INDEX IF NOT EXISTS idx_inventory_org_sku 
ON inventory_levels (organization_id, sku);

-- 4. Inventory movements audit ledger index
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_created 
ON inventory_movements (organization_id, created_at DESC);

-- 5. Customer email lookup index
CREATE INDEX IF NOT EXISTS idx_customers_org_email 
ON customers (organization_id, email);

-- 6. Order events communication timeline index
CREATE INDEX IF NOT EXISTS idx_order_events_order_created 
ON order_events (order_id, created_at DESC);
