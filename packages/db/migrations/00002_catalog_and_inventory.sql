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
