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
