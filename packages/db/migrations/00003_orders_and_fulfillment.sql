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
