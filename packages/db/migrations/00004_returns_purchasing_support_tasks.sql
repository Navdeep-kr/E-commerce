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
