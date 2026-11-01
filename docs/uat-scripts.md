# Storefront Ops — User Acceptance Testing (UAT) Scripts & Persona Matrix

**Document Version**: 1.0.0  
**Target Release**: GA Readiness / Phase 8  
**Scope**: 6 Primary Operational Roles & 12 End-to-End Journeys

---

## 1. Role-Based UAT Test Scripts

### 1.1 Persona: Warehouse & Fulfillment Associate
* **Goal**: Receive pick list, navigate warehouse without backtracking, verify items via barcode scanner, and generate shipping label in <30 seconds.
* **Pre-conditions**: Workspace loaded with paid unfulfilled orders and items placed in alphanumeric bin locations.
* **Test Steps**:
  1. Navigate to `/[orgSlug]/fulfillment`.
  2. Verify wave picking displays natural collation sorting (`A-01-01` $\to$ `A-02-04` $\to$ `B-01-02`).
  3. Open `/[orgSlug]/fulfillment/pack-station`.
  4. Scan barcode `SKU-HOODIE-BLK-M`. Listen for Web Audio verification chime.
  5. Scan mismatched barcode `SKU-WRONG-ITEM`. Verify buzz audio and visual mismatch warning.
  6. Click "Print Label & Dispatch". Verify carrier tracking number is generated and order status updates to `shipped`.
* **Expected Outcome**: Pick sequence is strictly sorted; item scan verification catches mismatches; packing completed in < 30 seconds.
* **Pass/Fail Status**: **PASS**

---

### 1.2 Persona: Inventory & Purchasing Planner
* **Goal**: Monitor velocity stockouts, generate automated draft purchase orders, and allocate landed freight/customs costs without penny drift.
* **Pre-conditions**: Products with 7-day and 30-day sales history.
* **Test Steps**:
  1. Open `/[orgSlug]/purchasing`.
  2. Inspect Velocity Reorder Queue. Verify `SKU-HOODIE-BLK-M` appears with recommended order quantity based on lead time + safety stock.
  3. Click "Generate Purchase Order". Verify PO state moves from `draft` $\to$ `submitted`.
  4. Receive PO: Enter $350.00 freight + $120.00 customs landed costs.
  5. Verify landed cost engine proportions costs proportionally down to the exact integer cent across line items.
* **Expected Outcome**: Zero penny drift; inventory levels increment atomically upon PO receiving.
* **Pass/Fail Status**: **PASS**

---

### 1.3 Persona: Customer Support Specialist
* **Goal**: Triage SLA-breaching tickets, view order history sidecar, and synthesize policy-compliant replies via AI Copilot.
* **Pre-conditions**: Active customer ticket with linked order ORD-8821.
* **Test Steps**:
  1. Open `/[orgSlug]/support`.
  2. View SLA countdown urgency badges (High / Critical).
  3. Select ticket #TCK-4029 ("Where is my order?").
  4. Inspect Customer Sidecar Panel showing Customer 360, lifetime spend ($1,250.00), and UPS tracking link.
  5. Click "Generate AI Copilot Draft". Verify macro interpolation (`{{customer_name}}`, `{{tracking_number}}`) and VIP greeting.
  6. Attempt to issue refund on Final Sale item: verify Copilot flags manager escalation instead of unauthorized refund.
* **Expected Outcome**: Context-aware empathetic response generated with strict policy boundary compliance.
* **Pass/Fail Status**: **PASS**

---

### 1.4 Persona: Finance Manager
* **Goal**: Audit double-entry ledger balance, inspect P&L with transaction drill-down, and reconcile bank payouts with $0.00 drift.
* **Pre-conditions**: Completed sales, refunds, payment gateway fees, and COGS.
* **Test Steps**:
  1. Open `/[orgSlug]/finance`.
  2. Verify Double-Entry Balance invariant: $\sum \text{debits} \equiv \sum \text{credits}$.
  3. Click "P&L Statement": Verify Gross Revenue, Returns, Discounts, COGS, and Net Operating Margin.
  4. Click on any P&L line item to drill down into underlying double-entry transaction IDs.
  5. Inspect Payout Reconciliation: Verify Stripe deposit matches gross sales minus refunds and fees with exact $0.00 variance.
* **Expected Outcome**: Real-time financial ledger matches independent spreadsheet calculations down to the exact cent.
* **Pass/Fail Status**: **PASS**

---

### 1.5 Persona: Marketing Manager
* **Goal**: Build discount promotions with stacking rule enforcement, generate UTM links, and review ROAS/MER/CAC metrics.
* **Pre-conditions**: Active marketing campaigns and ad spend data.
* **Test Steps**:
  1. Open `/[orgSlug]/marketing`.
  2. Create a 20% discount code with stacking rule set to `exclusive`.
  3. Attempt to apply an overlapping discount: verify validation rejects exclusive conflicts.
  4. Use UTM Link Builder: Generate tracked campaign URL with `utm_source=meta` and `utm_campaign=black_friday`.
  5. Inspect Attribution KPIs: Verify ROAS, MER, and Blended CAC formulas calculate accurately.
* **Expected Outcome**: Promotional stacking rules strictly enforced; clean UTM attribution tracking.
* **Pass/Fail Status**: **PASS**

---

### 1.6 Persona: Store Owner / Superadmin
* **Goal**: Configure team RBAC, manage Stripe subscription plan, generate scoped API keys, execute GDPR erasure, and view platform MRR.
* **Pre-conditions**: Authenticated as Owner role.
* **Test Steps**:
  1. Open `/[orgSlug]/settings/billing`: Upgrade plan from Starter to Growth. Verify instant quota update.
  2. Open `/[orgSlug]/settings/api-keys`: Create scoped API key with `orders:read` and `inventory:read`. Verify secret displayed once.
  3. Open `/[orgSlug]/settings/privacy`: Execute GDPR Article 17 erasure on customer. Verify PII scrubbed while financial totals remain intact.
  4. Open `/admin/tenants`: Inspect platform-wide MRR, active tenants table, and emergency freeze controls.
* **Expected Outcome**: Multi-tenant isolation verified; RBAC guards enforced; zero cross-tenant leakage.
* **Pass/Fail Status**: **PASS**
