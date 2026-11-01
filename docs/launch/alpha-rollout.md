# Staged Rollout Playbook: Phase 1 (Alpha 5-Store Pilot)

**Target Capacity**: Exactly 5 hand-picked pilot merchants  
**Rollout Goal**: Validate end-to-end data parity, inventory synchronization accuracy, physical packing station ergonomics, and Stripe financial settlement reconciliation under live operational conditions.

---

## 1. Pilot Merchant Selection Criteria

1. Multi-channel SKU catalog between 100 and 1,000 SKUs.
2. Daily order velocity of 20 to 100 orders/day.
3. Active Shopify or WooCommerce storefront with USPS / UPS carrier fulfillment.
4. Willingness to participate in dedicated shared Slack channels with 15-minute SLA.

---

## 2. Onboarding & Parity Verification Protocol

* **Day 1**: Dedicated technical architect pairs with merchant ops lead to connect storefront webhooks and import historical catalog via CSV parser.
* **Dual-Run Parity**: Run Storefront Ops in parallel with merchant's legacy system for 72 hours.
* **Audit Checks**:
  1. **Stock Movement Ledger**: Verify $\text{available} = \text{on\_hand} - \text{committed}$ matches legacy available counts 1:1.
  2. **Money Precision**: Verify 100% of order totals, discounts, and tax match down to the exact integer cent.
  3. **Tracking Sync**: Verify carrier tracking numbers dispatched from pack station propagate back to customer email without delay.

---

## 3. Exit Gates to Beta Promotion

* $\ge 500$ live orders fulfilled across the 5 pilot stores.
* 0 inventory oversells or stock ledger deadlocks.
* 0 financial reconciliation discrepancies ($drift = \$0.00$).
* Average pack station scan-to-print round-trip latency $< 40\text{ms}$.
* Merchant Ops Leads rate satisfaction $\ge 9/10$.
