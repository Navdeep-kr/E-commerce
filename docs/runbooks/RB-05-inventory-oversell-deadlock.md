# Runbook RB-05: Inventory Oversell & Stock Reservation Deadlock

**Severity**: P1 - CRITICAL  
**Alert Trigger**: `available_stock < 0` or PostgreSQL deadlock detected on `inventory_levels`.

---

## 1. Symptoms & Impact
* Flash sale checkout generates negative available stock (`available = on_hand - committed < 0`).
* Concurrent checkout workers timing out during `SELECT ... FOR UPDATE`.

## 2. Immediate Triage & Diagnostics
1. Inspect variant order in stock reservation locks: verify locks are consistently acquired in ascending variant ID order.
2. Query `inventory_levels` for any negative available stock:
   ```sql
   SELECT variant_id, on_hand, committed, (on_hand - committed) as available 
   FROM inventory_levels 
   WHERE (on_hand - committed) < 0;
   ```

## 3. Mitigation & Recovery Steps
1. **Release Abandoned Stock Holds**:
   * Run cleanup query to expire reservations held for $> 15\text{ minutes}$ without completed checkout:
   ```sql
   UPDATE inventory_levels 
   SET committed = committed - expired.qty 
   FROM (SELECT variant_id, sum(quantity) as qty FROM stock_reservations WHERE status = 'expired' GROUP BY variant_id) expired
   WHERE inventory_levels.variant_id = expired.variant_id;
   ```
2. **Recompute ATP Balance**:
   * Atomically recompute `available = on_hand - committed` across catalog.
3. **Verify Recovery**:
   * Available stock clamped strictly to $\ge 0$.
