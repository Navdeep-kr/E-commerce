# Product Requirements Document (PRD) — Storefront Ops

**Document Version**: 1.0  
**Status**: Ready for Validation  
**Owner**: Product Management & Engineering  

---

## 1. Target Customer Profile (ICP) & Segments

### 1.1 Primary Target Segments

#### Segment A: Fast-Growing Shopify/Woo Omnichannel Brands ("Scale-Up Merchants")
- **Order Volume**: 1,500 – 25,000 orders/month.
- **Team Size**: 5 – 25 employees (Warehouse staff, Operations/E-comm Manager, Support lead, Founder).
- **Channels**: Shopify Plus / WooCommerce storefronts + Amazon Marketplace + occasional pop-up/retail wholesale.
- **Current Stack**: Shopify Admin + ShipStation/EasyPost + Google Sheets for stock reordering + Gorgias/Zendesk for support + QuickBooks Online.
- **Top 5 Pains**:
  1. *Overselling during flash sales*: Shopify stock does not reserve until order placement is finished, causing inventory stockouts across channels.
  2. *Fragmented context for Customer Support*: Support agents spend 4+ minutes per ticket toggling between Shopify, ShipStation, and Stripe just to process an address change or return.
  3. *Spreadsheet-based Purchasing*: Inventory manager guesses reorder quantities based on trailing weeks without lead time or velocity calculation.
  4. *Fulfillment bottlenecks*: High error rates during manual pack station handling (shipping the wrong size/color variant).
  5. *Obscure True Margins*: Founder cannot see real-time contribution margin after ad spend, shipping label fees, gateway fees, and returns.

#### Segment B: High-Volume Single-Brand Warehouses ("Self-Fulfilling DTC Direct Brands")
- **Order Volume**: 5,000 – 50,000 orders/month.
- **Team Size**: 10 – 40 employees (dedicated warehouse team of 4–12 pickers/packers).
- **Channels**: 1–3 custom or Shopify stores with multiple warehouse stocking locations.
- **Current Stack**: Clunky legacy ERPs (NetSuite, Linnworks, Cin7) or duct-taped ShipStation + Excel.
- **Top 5 Pains**:
  1. *Inefficient warehouse picking paths*: Pickers wander back and forth across shelves; lack of batch/wave bin-sequenced pick lists.
  2. *Pack station mis-picks*: High customer complaint rates due to packers boxing incorrect variants.
  3. *Receiving & Landed Cost Delays*: Receiving purchase orders in the warehouse takes days to update available-to-promise inventory.
  4. *Complex Returns Processing*: Returned goods sit in receiving purgatory, leading to delayed customer refunds and stale quarantine stock.
  5. *Slow, non-responsive legacy software*: Enterprise ERPs take 4–8 seconds per screen transition.

### 1.2 Anti-Persona (Segment to Deliberately Ignore)
- **Dropshippers & Micro-Merchants (< 200 orders/month)**:
  - *Why Ignore*: Very low Willingness-to-Pay (< $30/mo), high churn, reliance on zero-inventory supplier automation (DSers, AliExpress), and negligible need for physical warehouse pack stations, bin locations, or purchase order matching.

---

## 2. Jobs To Be Done (JTBD) & 10 Core User Journeys

### Core JTBD Statement
> *"When our e-commerce order volume scales beyond spreadsheets, we want a single, real-time command center across sales, fulfillment, inventory, and support, so we can process orders with 100% accuracy, prevent stockouts, and understand true net profitability without drowning in disconnected tabs."*

### 10 Critical User Journeys with Success Criteria

1. **Morning Priority Triage (E-Commerce Manager)**:
   - *Journey*: Manager opens the "Today" dashboard at 8:00 AM, reviews overnight sales volume, detects 4 high-risk fraud holds, 2 failed payments, and 3 low-stock SKUs.
   - *Success Criteria*: Triages all 9 exceptions within 5 minutes without opening external apps.
2. **Fulfilling 200 Orders Before 1:00 PM Carrier Cutoff (Warehouse Lead)**:
   - *Journey*: Lead generates a batch pick list ordered by warehouse bin location for 200 priority orders. Pickers gather all SKUs in a single linear pass.
   - *Success Criteria*: Zero backtracking in the warehouse; pick time reduced by 40%.
3. **High-Speed Pack Station Scan & Ship (Warehouse Packer)**:
   - *Journey*: Packer scans an order slip, scans each product's barcode; system sounds a warning chime if a wrong variant is scanned. Packer selects standard box size, system auto-fetches the cheapest carrier rate, prints label and packing slip, and marks order packed.
   - *Success Criteria*: < 25 seconds per order; zero wrong items shipped.
4. **Preventing a Stockout Before Black Friday (Purchasing Planner)**:
   - *Journey*: Planner opens Reorder Planning; system flags 12 SKUs with stock depletion predicted within 14 days based on trailing 28-day velocity and supplier lead times. Planner clicks "Generate PO", which groups SKUs by vendor.
   - *Success Criteria*: PO drafts created and dispatched to vendors in under 2 minutes.
5. **Resolving an Order Address Change from Support Ticket (Support Agent)**:
   - *Journey*: Customer emails asking to change delivery address. In the Support Inbox, agent views the sidecar panel showing the open order in "Ready to Pack" status, updates the shipping address with live address validation, and replies using a canned macro.
   - *Success Criteria*: Ticket resolved in < 60 seconds without leaving the ticket interface.
6. **Processing a Customer Return & Instant Restock (Warehouse Returns Clerk)**:
   - *Journey*: Clerk scans the RMA barcode on a returned package. Inspects the item, grades it as "Grade A — Resellable", and selects "Restock to Bin A-12".
   - *Success Criteria*: `inventory_movements` ledger updates available stock immediately; Stripe refund issues automatically; audit log updated.
7. **Resolving a Supplier Bill 3-Way Match (Finance Accountant)**:
   - *Journey*: Freight and supplier invoice arrives. Accountant pulls up the PO in Purchasing, compares expected vs received quantities, allocates landed freight costs across line items, and approves bill for payout.
   - *Success Criteria*: Real gross margins on received products update automatically to reflect landed costs.
8. **Marketing Campaign ROAS & Contribution Margin Audit (Marketing Lead)**:
   - *Journey*: Marketer compares Facebook Ad spend ($3,200) against attributed revenue ($14,500), factoring in product COGS, merchant fees, and return rates.
   - *Success Criteria*: Displays true net contribution margin rather than misleading top-line ROAS.
9. **Flash Sale Real-Time Stock Allocation (Inventory Planner)**:
   - *Journey*: Store launches a flash sale selling 500 units in 10 minutes. Orders place holds on `committed` stock via `SELECT ... FOR UPDATE`.
   - *Success Criteria*: Exactly 500 units sold; system rejects 501st order cleanly without overselling.
10. **Offboarding / Role Permission Audit (Store Owner / Admin)**:
    - *Journey*: Owner modifies permissions for seasonal workers, restricting them strictly to Pick/Pack screens while blocking access to customer contact details, financials, and exports.
    - *Success Criteria*: Seasonal staff accounts immediately receive 403 Forbidden on restricted endpoints.

---

## 3. Competitive Teardown & Our Strategic Wedge

| Competitor | Strengths | Severe Weaknesses | Pricing |
| :--- | :--- | :--- | :--- |
| **Shopify Admin** | Deep native integration, clean UI | Disconnected multi-store view, weak warehouse batch picking, zero landed-cost accounting, minimal PO tracking | Free with Shopify |
| **ShipStation** | Strong carrier integrations, label printing | Horrible inventory tracking, zero support ticketing, no PO management, fragmented UI | $9 – $230/mo |
| **Cin7 / Dear Systems** | Full inventory & B2B features | Bloated 2005-era UI, slow (5s+ page loads), opaque setup taking 3–6 months, poor support | $349 – $999/mo |
| **Linnworks** | Deep multi-channel listing sync | Extremely complex, brittle sync rules, steep learning curve, high enterprise onboarding fees | $500 – $2,500/mo |
| **Katana Cloud MRP** | Modern UI, good manufacturing tracking | Tailored for makers/manufacturers, weak multi-carrier fulfillment and customer support | $179 – $799/mo |

### Our 1-Sentence Strategic Wedge:
> **"The single modern, sub-second operations workspace that unifies real-time warehouse fulfillment, append-only inventory, and customer support for mid-market e-commerce teams—replacing 5 fragmented tools at half the total cost."**

---

## 4. MVP Scope Cut (Launch vs Post-Launch)

| Module | Launch (MUST) | Launch + 60 Days (SHOULD) | Later (Future) | Justification |
| :--- | :---: | :---: | :---: | :--- |
| **Auth & Multi-Tenancy (3.1)** | **MUST** | - | - | Secure tenant isolation and RBAC are non-negotiable. |
| **Today Dashboard (3.2)** | **MUST** | - | - | Core value proposition: "See what needs attention today". |
| **Orders & Fulfillment (3.3, 3.4)** | **MUST** | - | - | Order processing from placement to shipping label is the lifeblood. |
| **Catalog & Inventory (3.6, 3.7)** | **MUST** | - | - | Append-only ledger prevents overselling; core table integrity. |
| **Support Inbox & Sidecar (3.11)**| **MUST** | - | - | Essential for unified workflow (order actions directly from tickets). |
| **Returns Intake & Receiving (3.5)**| **MUST** | - | - | Warehouse closing the loop on inventory restock and refunds. |
| **Purchasing & POs (3.8)** | **MUST** | - | - | Essential for stock replenishment and landed cost calculation. |
| **Integrations: Shopify & Shippo**| **MUST** | - | - | Primary platform and shipping aggregator required on day one. |
| **Finance & P&L (3.12)** | - | **SHOULD** | - | Basic transaction ledger at launch; advanced 3-way match in 60 days. |
| **Marketing Attribution (3.10)** | - | **SHOULD** | - | Basic discount engine at launch; Meta/Google API sync at 60 days. |
| **Workflow Board (3.13)** | - | **SHOULD** | - | Pre-configured task triggers at launch; full custom kanban in 60 days. |
| **Visual Automations (3.15)** | - | **SHOULD** | - | Core hardcoded business rules at launch; drag-and-drop rule builder at 60d. |
| **AI Assistant (Step 16)** | - | - | **LATER** | High-value differentiator once foundational ops data is dense and steady. |
| **B2B Wholesale Portal** | - | - | **LATER** | Dedicated wholesale ordering can come post-PMF. |

---

## 5. Success Metrics & KPIs

1. **Time-to-First-Value (TTFV)**: Under **15 minutes** from signup to first store connected and orders visible.
2. **Order Processing Efficiency**: Warehouse packers process a verified order in **< 30 seconds**.
3. **Inventory Discrepancy Rate**: **0.00%** phantom stockout or overselling incidents.
4. **Weekly Active Teams (WAT)**: > 75% of invited team members active 4+ days a week.
5. **Support First-Contact Resolution**: Reduced from 8.5 minutes to **under 2 minutes** per order-related ticket.

---

## 6. Pricing Hypothesis

- **Value Metric**: Monthly Order Volume (scales naturally with merchant revenue).
- **Free Trial**: 14 days full access, no credit card required, with pre-loaded demo workspace option.

| Tier | Price | Monthly Order Cap | Included Seats | Target Customer |
| :--- | :--- | :--- | :--- | :--- |
| **Starter** | **$149 / mo** | Up to 1,500 orders | 3 seats | Boutique brands scaling beyond Shopify Admin |
| **Growth** | **$349 / mo** | Up to 7,500 orders | 10 seats | Fast-growing multi-channel brands with warehouses |
| **Scale** | **$799 / mo** | Up to 25,000 orders | Unlimited seats | Mid-market DTC merchants with complex fulfillment |
| **Enterprise** | Custom | 25,000+ orders | Dedicated Support + SLA | High-volume multi-warehouse operations |

---

## 7. Top 10 Risks & Mitigations

1. **Risk: Inventory Race Conditions**: High-concurrency flash sales causing overselling.  
   *Mitigation*: Enforce `SELECT ... FOR UPDATE` ordered by variant ID in PostgreSQL transactions; append-only `inventory_movements`.
2. **Risk: Shopify Rate Limiting**: Bulk backfills hitting GraphQL / REST bucket caps.  
   *Mitigation*: Implement token-bucket client with exponential backoff and GraphQL Bulk Operations API.
3. **Risk: Shipping Label Failure at Pack Station**: Carrier API outage halts warehouse pack lines.  
   *Mitigation*: Fallback shipping providers, offline label queuing, and graceful error recovery with instant retry.
4. **Risk: Tenant Data Leakage**: Support agent from Store A viewing Store B customer records.  
   *Mitigation*: PostgreSQL Row-Level Security (RLS) on `organization_id` on every table; automated tenant isolation tests in CI.
5. **Risk: Currency & Floating-Point Drift**: Currency conversions causing discrepancies.  
   *Mitigation*: Store all money in integer minor units (e.g. cents) with explicit ISO currency fields.
6. **Risk: Warehouse Mobile Usability**: Slow, awkward touch interaction on rugged scanners or phones.  
   *Mitigation*: Dedicated mobile/scanner mode with large 48px+ tap targets, audible/haptic feedback, and camera/hardware barcode wedge listeners.
7. **Risk: High Scope Creep**: Attempting to build an ERP, CRM, and Helpdesk all in week one.  
   *Mitigation*: Strict adherence to Playbook steps; MVP cut (MUST list only for launch); decoupled adapter interfaces.
8. **Risk: Out-of-Order Webhooks**: Shopify sending order update before order creation.  
   *Mitigation*: Idempotent webhook event store (`webhook_events`) with replay protection and transactional upserts.
9. **Risk: Inaccurate Landed Cost**: Shipping and duty costs not accurately distributed to unit margins.  
   *Mitigation*: Clear FIFO and weighted-average landed cost allocation algorithms in `packages/core`.
10. **Risk: User Adoption Friction**: Warehouse staff refusing to switch from paper/ShipStation.  
    *Mitigation*: Sub-second UI response times, full keyboard shortcuts, and zero-confusion 1-click workflows.

---

## 8. Customer Discovery Scripts (5 Personas) & Waitlist Copy

### Discovery Interviews
- **Script 1 (E-commerce Manager)**: "Walk me through the first hour of your workday. Where do you look first? What surprises you?"
- **Script 2 (Warehouse Lead)**: "How does an order get from paid to boxed up today? Where do items get misplaced or mis-picked?"
- **Script 3 (Purchasing Planner)**: "How do you decide when to reorder and how many units to buy? What was your last stockout and why did it happen?"
- **Script 4 (Support Lead)**: "When a customer asks to change their address or cancel an order, what steps and screens do you click through?"
- **Script 5 (Finance/Founder)**: "How do you know your true gross and net margins on a product after ad spend, shipping labels, and payment fees?"

### Landing Page Waitlist Copy
- **Headline**: *One Workspace for Your Entire E-Commerce Operation.*
- **Subheadline**: *Stop juggling Shopify tabs, ShipStation, spreadsheets, and support tickets. Storefront Ops connects your sales, warehouse, inventory, and support teams in real time.*
- **Call-to-Action**: `[Request Early Access — 14-Day Free Trial]` (Tagline: *No credit card required. Connect your store in 5 minutes.*)
