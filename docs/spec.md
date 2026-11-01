# Storefront Ops: Master Specification (Parts 1–9)

## Part 1: Master Prompt & High-Level Architecture
Storefront Ops is a production-grade operations platform for e-commerce departments. It is one workspace where sales, fulfillment, inventory, marketing, support, and finance teams run their daily workflow, replacing spreadsheets and fragmented admin panels.

### Primary Users & Roles
- **Owner / Admin**: Everything, including billing, integrations, roles, data export, deletion.
- **Manager**: All operational screens, approvals, reports, team tasks; no billing or integration secrets.
- **Fulfillment / Warehouse**: Orders (view, pick, pack, ship), inventory counts, returns receiving.
- **Purchasing / Inventory Planner**: Inventory, suppliers, purchase orders, stock transfers.
- **Marketing**: Campaigns, discounts, channels, customer segments, reports.
- **Support**: Customers, orders (view, edit address, refund request), tickets, returns.
- **Finance**: Payments, refunds approval, payouts, expenses, P&L, reports; read-only elsewhere.
- **Viewer**: Read-only dashboards.

### Core Goals
1. See what needs attention today.
2. Move every order from placed to delivered with no dropped steps.
3. Never stock out or over-order.
4. Track what marketing spend returns.
5. Resolve customer issues fast.
6. Reconcile money accurately.
7. Keep every team's tasks in one unified space.

### Tech Stack
- **Frontend**: Next.js (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, TanStack Table v8, TanStack Query v5, Recharts, React Hook Form + Zod.
- **Backend**: Next.js route handlers / Server Actions, PostgreSQL via Supabase (auth, RLS, storage, realtime), background jobs with an async queue (Inngest / BullMQ).
- **Integrations behind Adapters**: `OrdersProvider` (Shopify Admin API, WooCommerce REST), `InventoryProvider`, `PaymentsProvider` (Stripe), `ShippingProvider` (Shippo / EasyPost), `MessagingProvider` (Resend, Twilio), Ad platforms (Meta, Google).

---

## Part 2: Roles, Permissions, and Global Features

### Permission Matrix
Permissions are configurable per role (`view`, `create`, `edit`, `delete`, `approve`, `export`) per module. Admins can create custom roles.

### Global System Features (Every Screen)
- **Left Sidebar**: Collapsible, module navigation with real-time badges (e.g. Orders: 12 waiting to pack, Inventory: 5 low).
- **Top Bar**: Global search (`Cmd/Ctrl+K`), workspace/store switcher, notifications bell, quick-create menu (`order`, `product`, `task`, `ticket`), user profile & role switcher.
- **Command Palette**: Rapid keyboard navigation and quick actions (`Cmd+K`).
- **Notification Center**: In-app realtime, email, optional SMS/Slack. User-configurable trigger rules.
- **Activity & Audit Log**: Who did what, when, before and after values (JSON delta), filterable and exportable.
- **Comments & @Mentions**: Rich commentary on orders, products, customers, tickets, tasks.
- **Attachments**: Images/PDFs stored in secure object storage with signed URLs.
- **Saved Views & Filters**: Per-user saved views, shareable with teams.
- **Multi-Store Support**: One workspace holding multiple stores/channels with top-level store filter.
- **Multi-Currency & Timezones**: Per-store native currency with workspace reporting currency.
- **Keyboard Shortcuts**: E.g., `g` then `o` for Orders, `n` for new record, `/` for search; shortcut modal (`?`).
- **Realtime Updates**: New orders, stock adjustments, and task movements update without page reload.

---

## Part 3: Screen-by-Screen Specification

### 3.1 Authentication & Onboarding
- Sign up, login (email/password, magic link, Google SSO), password reset, optional TOTP 2FA, session list with remote revocation.
- Onboarding wizard: create workspace, connect store (Shopify/Woo/CSV/Demo data), set currency/timezone, define warehouse locations, invite team with assigned roles, enable desired modules.
- First-run checklist on dashboard with live progress indicator.

### 3.2 Today (Home Dashboard)
- **KPI Row** with period selector (today, 7d, 30d, custom) & delta comparisons: revenue, orders, AOV, conversion rate, refund rate, new vs returning customers.
- **Action Queue**: Orders to pack, orders on hold, late shipments, failed payments, low-stock items, SLA-breaching tickets, overdue tasks. Clicking links directly to filtered list views.
- **Charts & Breakdown**: Hourly/daily revenue, sales by channel, top products, top geographic regions.
- **Activity Feed & Due Tasks**: Team tasks due today and streaming event log.
- **Role-Aware Widget Layout**: Warehouse sees packing queue first; marketing sees campaigns first.

### 3.3 Orders
- **List View**: Columns for order #, date, customer, channel, items count, total, payment status, fulfillment status, shipping method, tags, assignee. Comprehensive filters, saved views, and bulk actions (print packing slips/labels, mark packed/shipped, tag, assign, cancel, export CSV).
- **Create Order**: Customer selector/creator, product variant picker with live stock reservation, discounts, custom line items, shipping calculation, tax calculation, payment options (mark paid, payment link, COD).
- **Detail View**: Status chips, order totals, line items with variant/SKU/quantity/fulfilled/returned counts, editable shipping/billing addresses (with address validation), payment transaction panel (auth, capture, refund, fraud risk), multi-shipment fulfillment panel, order edit engine with diff log, timeline & customer email log.
- **Status Machine**: `Pending payment` -> `Paid` -> `On hold` -> `Ready to pack` -> `Packing` -> `Packed` -> `Shipped` -> `Delivered` (or `Cancelled`, `Returned`, `Partially fulfilled`).
- **Fraud & Risk Scoring**: Automated risk flags (address mismatch, high value, repeated failures, IP anomalies) with approve/cancel workflow.

### 3.4 Fulfillment (Warehouse Workspace)
- **Pick Lists**: Wave/batch picking grouped by zone, carrier, or SLA; optimized bin sequence pick path; mobile-friendly barcode scan verification.
- **Pack Station**: Scan order barcode, scan items, verify counts, mismatch audio/visual alert, box size selection, weight capture, buy rate-shopped shipping label, print label & packing slip, mark packed in 1 flow.
- **Shipping Engine**: Carrier rate shopping, rules (free shipping thresholds, cheapest/fastest, weight/zone), label purchase/void, end-of-day manifest/close, pickup scheduling, international customs documentation.
- **Tracking & Exceptions**: Live tracking sync, delivery exceptions queue, late-shipment alerts, SLA countdown board.
- **Backorder Engine**: Automatic hold release when received inventory covers backordered lines.

### 3.5 Returns & Exchanges
- **Intake**: Staff intake & public customer self-service return portal.
- **Policy Engine**: Return window validation, condition/item eligibility, photo upload.
- **Resolutions**: Refund, store credit, exchange, or warranty repair with prepaid return label generation.
- **Receiving & Grading**: Barcode scan on return arrival, condition grading (restock, quarantine, dispose), automatic inventory update, and automated refund trigger.
- **Return Analytics**: Return rate by SKU, reason, and supplier.

### 3.6 Products & Catalog
- **List View**: Thumbnail, title, SKU, status (active/draft/archived), vendor, available stock, price, channel visibility, bulk price/tag edit.
- **Product Editor**: Rich text description, drag-reorder media gallery, variant matrix (size/color/SKU/barcode/price/compare-at/cost/weight/dimensions), tax class, tags, collections, SEO fields, metafields.
- **Bundles / Kits**: Component inventory logic where bundle availability = min(component availability).
- **CSV Import / Export**: Column mapping, dry-run validation with row-by-row error reporting.
- **Margin View**: Price, cost, platform fees, and gross margin percentage per SKU.

### 3.7 Inventory
- **Stock Overview**: Per-variant and per-location: on hand, committed, available, incoming, reorder point, days of stock left, status (OK, low, out, overstock).
- **Inventory Ledger**: Add, remove, set count with mandatory reason codes (damage, loss, found, correction, sale, return, PO receipt). Append-only `inventory_movements`.
- **Transfers & Cycle Counts**: Multi-location stock transfers (in-transit -> received); scheduled cycle counts with mobile barcode scanning and variance reconciliation.
- **Reorder Planning**: Demand forecasting from trailing 28-day velocity, lead time, and safety stock. 1-click PO draft generation.
- **Valuation**: FIFO and weighted-average inventory valuation reports.

### 3.8 Purchasing & Suppliers
- **Supplier Directory**: Contacts, lead times, MOQ, payment terms, currency, scorecard (on-time rate, defect rate).
- **Purchase Orders (POs)**: Draft, sent, confirmed, partially received, received, closed, cancelled. PDF/email generation.
- **Receiving & Landed Cost**: Partial receipts, damage logging, landed cost (freight, duty, handling) allocation across items.
- **Three-Way Match**: PO vs receipt vs supplier bill reconciliation for Finance.

### 3.9 Customers
- **Customer List & Profiles**: Spend, orders count, LTV, last order date, addresses, communication history, store credit, loyalty points, RFM score.
- **Segmentation**: Rule-based dynamic segments (e.g. spend > $500, inactive 90 days, VIP).
- **Privacy Tools**: Merge duplicates with undo, GDPR/CCPA data export (JSON) and anonymization/deletion workflows.

### 3.10 Marketing
- **Campaign Planner**: Omnichannel campaign tracking (Email, SMS, Social, Ads) with budgets, target goals, UTM builder.
- **Discounts Engine**: Percentage, fixed amount, BOGO, tiered, free shipping with stacking rules, customer eligibility, and usage limits.
- **Abandoned Cart Sequences**: Recovery reminders, sequence tracking, and recovered revenue analytics.
- **Ad Spend & Attribution**: Meta & Google Ads import, ROAS, CAC, MER, contribution margin by channel.

### 3.11 Customer Support
- **Omnichannel Inbox**: Email, contact form, live chat with SLA countdown timers, priorities, and assignments.
- **Customer Sidecar Panel**: Order history and instant actions inside tickets (refund, change address, issue store credit, generate return label).
- **Macros & Knowledge Base**: Canned replies with dynamic variables, agent collision detection, public and internal KB.

### 3.12 Finance
- **Payments & Disputes**: Multi-gateway transaction ledger, chargeback evidence management and deadlines.
- **Payout Reconciliation**: Match processor payouts to orders and bank deposits with discrepancy tolerance reporting.
- **Refund Approvals**: Multi-tier approval thresholds by user role.
- **P&L & Accounting**: Revenue, discounts, refunds, COGS, shipping, ad spend, gross/net margins, sales tax/VAT reporting, QuickBooks/Xero journal export.

### 3.13 Workflow Board (Tasks & Projects)
- **Kanban & List**: To Do, In Progress, Blocked, Review, Done. Custom team views and calendar view.
- **Task Structure**: Due dates, priorities, assignees, watchers, checklists, attachments, and bidirectional links to Orders, Products, Tickets, POs.
- **Handoff Rules & Event Triggers**: Low stock automatically triggers a Purchasing PO task; chargeback creates a Finance dispute task.

### 3.14 Reports & Analytics
- **Prebuilt Analytics**: Sales velocity, fulfillment speed, inventory turnover, stockout frequency, customer cohort retention.
- **Custom Report Builder**: Visual metrics builder compiling to safe parameterized SQL queries, exportable to CSV/PDF, schedulable via email.

### 3.15 Automations
- **Visual Rule Builder**: Trigger + Condition + Action architecture.
- **15 Prebuilt Recipes**: VIP tagging, high-risk order hold, low-stock PO draft, review requests 7 days post-delivery, ticket escalation after 4 hours SLA breach.
- **Execution Log**: Idempotent runs, retry with backoff, loop protection, and simulated dry-run mode.

### 3.16 Integrations & Connectors
- **Marketplace**: Shopify, WooCommerce, Stripe, PayPal, Shippo/EasyPost, Meta Ads, Google Ads, QuickBooks, Xero, Resend, Twilio, Slack.
- **Sync Engine**: Bi-directional sync, conflict resolution policy, rate limiting with token bucket, webhook health monitor.
- **Public REST API & Webhooks**: `/v1` endpoints with scoped API keys, rate limit headers, and signed HMAC webhooks.

### 3.17 Settings
- Workspace configuration, currency/timezone, locations, shipping zones, tax rules, team & custom roles, notification templates, custom fields, data retention, billing.

---

## Part 4: Data Model Integrity Principles
- **Keys & Multi-tenancy**: UUID v4 primary keys, `organization_id` on every table, `created_at`, `updated_at`, soft deletes (`deleted_at`).
- **Inventory Ledger**: `inventory_movements` is strictly append-only. Stock adjustments recalculate `inventory_levels` atomically (`available = on_hand - committed`).
- **Money Precision**: Integer minor units (e.g. USD cents: $12.50 = 1250) + ISO currency string. No floating-point math.
- **Order State Machine**: Strict status transitions validated server-side, logging an atomic `order_events` entry for every transition.
- **Concurrency**: Concurrency-safe stock reservations using `SELECT ... FOR UPDATE` ordered by variant ID to avoid deadlocks.

---

## Part 5: Core Automations & Business Logic
1. Stock reserved on order creation; released on cancellation; deducted on shipment.
2. Auto-hold high-risk orders and alert reviewer.
3. Auto-release backordered orders when incoming stock arrives (FIFO).
4. Low stock triggers automated reorder task and draft purchase order.
5. Late shipment detection against ship-by SLA with manager escalation.
6. Automated post-delivery review request sequence.
7. Role-based refund approval thresholds.
8. Received returns automatically restock inventory and post refunds.
9. Resilient sync jobs with exponential backoff and conflict resolution.
10. Nightly cron jobs for forecasting, valuation snapshots, and scheduled reports.

---

## Part 6: Design & UX Requirements
- Clean, data-dense UI with neutral surfaces and high-contrast semantic accents.
- Never rely on color alone (always combine icon + label).
- Table sticky headers, column visibility toggles, right-side sliding detail drawers, responsive card layouts on mobile.
- Touch-friendly warehouse pack & count screens with large scan targets and audio feedback.

---

## Part 7: Security & Reliability
- Row-Level Security (RLS) on every table in PostgreSQL.
- Zod schema validation on client and server for every request payload.
- Zero client-exposed API secrets.
- Full tamper-evident audit logging (`audit_log`) capturing actor, action, timestamp, entity, before and after JSON snapshots.

---

## Part 8: Phased Build Plan
- **Phase 1**: Foundation (Auth, workspace, roles & permissions, layout shell, global search, notifications, audit log, seed data).
- **Phase 2**: Catalog & Inventory (Products, variants, locations, inventory ledger, adjustments, transfers, CSV import).
- **Phase 3**: Orders & Fulfillment (Order list & detail, state machine, pick lists, pack station, shipping label generation, tracking).
- **Phase 4**: Customers, Returns & Support (Customer profiles, returns receiving & refunding, omnichannel ticket inbox).
- **Phase 5**: Purchasing & Finance (Suppliers, POs, landed costs, payment reconciliation, expenses, P&L).
- **Phase 6**: Marketing & Analytics (Campaigns, discounts, attribution, reports builder).
- **Phase 7**: Workflow Board & Automations (Task boards, visual rule builder, trigger engine).
- **Phase 8**: Integrations & Production Hardening (Shopify/Woo two-way sync, carrier APIs, public REST API, load testing).

---

## Part 9: Prompts & Working Rules
- Start of each session: Read working agreement, spec, decisions, and git log. Summarize current state in 10 lines and propose smallest next step.
- Build screen by screen with loading, empty, error, and permission-denied states.
- List what works, what is stubbed, and how to test it after each step.
