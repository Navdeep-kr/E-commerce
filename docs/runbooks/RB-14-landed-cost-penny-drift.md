# Runbook RB-14: Landed Cost Allocation Penny Drift & Rounding Discrepancy

**Severity**: P2 - HIGH  
**Alert Trigger**: `landed_cost_allocation_remainder_cents > 0` on purchase order receipt finalization.

---

## 1. Symptoms & Impact
* Purchase order receipt landed cost allocation (freight, customs duties, insurance, handling) leaves unallocated cents when distributed proportionally across multi-item shipments.
* Inventory asset valuation ledger drifts by 1–5 cents from actual bills paid.

## 2. Immediate Triage & Diagnostics
1. Inspect the affected purchase order receipt record:
   ```json
   {
     "po_id": "po_8819",
     "freight_cents": 10000,
     "item_count": 3,
     "allocated_cents": [3333, 3333, 3333],
     "unallocated_cents": 1
   }
   ```
2. Verify algorithm implementation:
   * System must use Largest-Remainder / Hare-Niemeyer method or allocate penny remainder to the highest-value line item rather than truncating.

## 3. Mitigation & Recovery Steps
1. **Apply Largest-Remainder Rounding Algorithm**:
   * Distribute the remainder cent(s) to the line item with the highest landed value share.
2. **Post Balancing Valuation Entry**:
   * Ensure sum of line item unit landed costs strictly equals total invoice landed cost:
     $$\sum \text{Allocated Landed Costs} = \text{Total Incurred Freight \& Duty}$$
3. **Audit Inventory Balance Sheet**:
   * Run automated recalculation for any downstream inventory valuation adjustments.
4. **Verify Recovery**:
   * Unallocated remainder is strictly 0 cents; inventory valuation ledger matches supplier invoice exactly.
