# Storefront Ops: Execution Playbook (Steps 0–28)

## Overview & Execution Protocol
This playbook defines the exact step-by-step roadmap for building Storefront Ops from inception to production deployment.

### Rules of Engagement:
1. Work on **ONE step at a time**.
2. Never start the next step until the user types **APPROVED**.
3. Plan first: list files to be created or changed, then wait for confirmation.
4. Strictly abide by the working agreement in `CLAUDE.md`.

---

## Step 0: Product Definition & Validation (Before Any Code)
- **Goal**: Be certain what we are building, for whom, and what the first public version includes.
- **Deliverables**: `/docs/prd.md` containing:
  1. Target customer profile (2 primary segments, 1 anti-persona).
  2. Jobs to be done and 10 detailed user journeys.
  3. Competitive teardown (ShipStation, Linnworks, Katana, Cin7, Shopify Admin) & our 1-sentence wedge.
  4. MVP cut (MUST, SHOULD, LATER) mapped to journeys.
  5. Success metrics (activation, WAU, time-to-first-value, retention).
  6. Pricing hypothesis (3 tiers, value metric, free trial).
  7. Top 10 risks & mitigations.
  8. 5 customer discovery interview scripts & landing-page waitlist copy.
- **Exit Check**: 5 real store team personas validated; MUST list fits the achievable timeline.

---

## Step 1: Repository, Tooling, and Conventions
- **Goal**: Establish the monorepo / project structure, linting, type-checking, and CI foundations.
- **Deliverables**:
  - `apps/web`: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui.
  - `packages/core`: Pure business logic (order state machine, inventory math, money rounding, tax).
  - `packages/integrations`: Adapter abstractions (`OrdersProvider`, `InventoryProvider`, `PaymentsProvider`, `ShippingProvider`).
  - ESLint, Prettier, commitlint, Vitest, Playwright, Zod env validation, GitHub Actions workflows.
- **Exit Check**: Clean install and dev server run (`npm run dev`), tests pass, pre-commit hooks enforce standards.

---

## Step 2: Infrastructure and Environments
- **Goal**: Define dev, staging, and production environments, secret management, and background queues.
- **Deliverables**: `/docs/infra.md`, database provisioning scripts (`db:migrate`, `db:seed`, `db:reset`), Inngest background job structure.
- **Exit Check**: Disposable database branch setup, staging reseeding in < 5 minutes.

---

## Step 3: Database Schema, Security, and Core Functions
- **Goal**: PostgreSQL schema with Row-Level Security on every table.
- **Deliverables**: Versioned SQL migrations, multi-tenant `organization_id` foreign keys, RLS policies, audit triggers, `inventory_movements` append-only trigger, `adjust_stock` function, and `transition_order` status validator.
- **Exit Check**: pgTAP / unit tests prove tenant isolation, concurrency tests prevent overselling under parallel stock reservation.

---

## Step 4: Authentication, Organizations, and Permissions
- **Goal**: Complete authentication, session management, organization switcher, and role-based access control.
- **Deliverables**: Supabase Auth integration, session management, team invite flow, role permission matrix (`requirePermission(module, action)` middleware and server guards).
- **Exit Check**: Support user cannot access or query Finance routes; UI and API block unauthorized access.

---

## Step 5: Design System and Application Shell
- **Goal**: Production-grade UI components and accessible layout shell.
- **Deliverables**:
  - Accessible components: `DataTable` (sort, filter, saved views, CSV export), `CommandPalette` (`Cmd+K`), `FilterBar`, `KPICard`, `Drawer`, `Timeline`, `StatusPill`.
  - Shell: Collapsible sidebar with status badges, multi-store switcher, notification bell, quick-create dialog, dark/light theme switch, mobile warehouse responsiveness.
- **Exit Check**: Shell runs smoothly on 375px mobile and 1920px desktop; WCAG AA keyboard navigation passes.

---

## Step 6: Demo Data & Developer Experience
- **Goal**: Deterministic seed generator with rich, realistic e-commerce datasets.
- **Deliverables**: Multi-store seed script generating 2 stores, 3 warehouses, 400 products with variants, 60 POs, 8,000 customers, 25,000 orders across 12 months with edge cases (backorders, returns, chargebacks).
- **Exit Check**: All screens populate realistically out-of-the-box; seed runs in under 2 minutes.

---

## Step 7: Catalog and Inventory Module (Part 3.6 & 3.7)
- **Deliverables**: Product CRUD, variant matrix, CSV import with column mapping, inventory ledger, stock transfers, cycle counts, reorder planning algorithms, bundles/kits.
- **Exit Check**: Bulk CSV import succeeds without timeouts, inventory ledger reconciles 100% to on-hand minus committed stock.

---

## Step 8: Orders Module (Part 3.3)
- **Deliverables**: Orders table with faceted filters and saved views, manual order creation with live stock reservation, order detail panel, PDF packing slip & invoice generation, order edit engine.
- **Exit Check**: 1,000 carts calculate totals matching an independent reference; status transitions strictly enforce preconditions.

---

## Step 9: Fulfillment and Shipping Module (Part 3.4)
- **Deliverables**: Wave/batch picking with bin-sequence path optimization, touch/barcode pack station with audio mismatch cues, shipping provider rate shopping, label purchase & print, tracking exception board.
- **Exit Check**: Packer processes simulated order in < 30s using barcode/keyboard only; shipping failure handles rollbacks cleanly.

---

## Step 10: Returns, Customers, and Support Modules (Parts 3.5, 3.9, 3.11)
- **Deliverables**: Customer return portal & warehouse condition grading restock flow; unified customer profiles with RFM metrics and merge tools; omnichannel support inbox with order action sidecar.
- **Exit Check**: Return intake in warehouse automatically increments inventory and processes customer refund.

---

## Step 11: Purchasing and Finance Modules (Parts 3.8, 3.12)
- **Deliverables**: Supplier directory, purchase orders lifecycle, landed-cost allocation, transaction ledger, payout reconciliation, P&L statement with drill-down.
- **Exit Check**: P&L matches independent spreadsheet calculation down to the cent with full transaction drill-down.

---

## Step 12: Marketing and Analytics Modules (Parts 3.10, 3.14)
- **Deliverables**: Campaign planner, discounts engine with stacking rules, ad spend import (Meta/Google), ROAS/CAC/MER calculation, custom report builder.
- **Exit Check**: Metric definitions are globally consistent and queries compile to safe parameterized SQL.

---

## Step 13: Workflow Board and Automation Engine (Parts 3.13, 3.15)
- **Deliverables**: Kanban/List task board with cross-entity links; visual rule builder (triggers, conditions, actions); 15 prebuilt recipes; execution run logs with loop prevention.
- **Exit Check**: Low-stock event creates exactly one reorder task even when events are replayed.

---

## Step 14: Integrations Layer (Shopify, WooCommerce, Stripe, Carriers) (Part 3.16)
- **Deliverables**: Decoupled adapter implementations for Shopify Admin API, WooCommerce REST, Stripe, Shippo/EasyPost; webhook listeners with HMAC validation and replay protection.
- **Exit Check**: Outage simulation and network replay test produces zero duplicate orders and zero missing stock sync updates.

---

## Step 15: Public REST API & Webhooks
- **Deliverables**: `/v1` REST API, scoped API keys, OpenAPI 3.1 schema, rate-limiting headers, HMAC-signed outbound webhooks.
- **Exit Check**: Third-party developer can authenticate and perform order sync using documentation in under an hour.

---

## Step 16: AI Assistant & Intelligent Operations
- **Deliverables**: Read-only tenant-scoped natural language query assistant, predictive demand forecasting, support draft replies, anomaly detection.
- **Exit Check**: 100 benchmark queries pass with 0 prompt-injection vulnerability and 0 tenant data leakage.

---

## Step 17: SaaS Billing & Multi-tenant Admin
- **Deliverables**: Stripe subscription billing (Starter, Growth, Scale), usage metering, organization limits enforcement, internal superadmin back-office.
- **Exit Check**: Full Stripe billing lifecycle (trial -> active -> past due -> canceled -> reactivated) handles state properly.

---

## Step 18: Communications & Notification Engine
- **Deliverables**: Transactional email/SMS templates, customer notifications with order tracking links, in-app notification center.
- **Exit Check**: All sent communications appear on the order timeline; opt-outs sync across channels.

---

## Step 19: Performance, Load Testing & Scalability
- **Deliverables**: Database indexing audit, keyset pagination, Redis caching, k6 load testing scripts (peak sale 50 orders/sec).
- **Exit Check**: Peak-sale load test passes with p95 < 300ms and zero dropped orders.

---

## Step 20: Security Hardening & Penetration Testing
- **Deliverables**: STRIDE threat model, CSP headers, rate-limiting, dependency vulnerability patch, tenant fuzzing tests.
- **Exit Check**: Zero open critical/high vulnerabilities; tenant boundary fuzz tests pass 100%.

---

## Step 21: Legal, Compliance & Privacy
- **Deliverables**: Terms of Service, Privacy Policy, DPA, GDPR/CCPA data export & deletion tooling, WCAG 2.2 AA accessibility audit.
- **Exit Check**: Automated privacy deletion request executes cleanly across all tables with audit trails.

---

## Step 22: Testing, QA & Acceptance
- **Deliverables**: Full test pyramid (unit, integration, e2e Playwright suites for all 12 core journeys), UAT scripts per role.
- **Exit Check**: All 12 end-to-end flows pass on CI.

---

## Step 23: Observability & Runbooks
- **Deliverables**: Structured telemetry, error tracking (Sentry), uptime monitoring, top 15 incident runbooks in `/docs/runbooks`.
- **Exit Check**: Simulated staging failure triggers alerts and runbook successfully guides recovery.

---

## Step 24: CI/CD & Zero-Downtime Deployment
- **Deliverables**: GitHub Actions deployment pipelines, expand-contract database migrations, preview environments.
- **Exit Check**: Zero-downtime deployment verified with rollback demonstration.

---

## Step 25: Documentation & Help Center
- **Deliverables**: Interactive in-app onboarding checklist, role-based user guides, API docs, developer guides.
- **Exit Check**: Unassisted user can onboard and process an order in < 30 minutes.

---

## Step 26: Marketing Site & Launch Assets
- **Deliverables**: High-converting marketing landing page, interactive sandbox demo, pricing calculator, SEO metadata.
- **Exit Check**: Public visitors can understand value in 10s and test the interactive demo.

---

## Step 27: Staged Launch (Alpha -> Beta -> GA)
- **Deliverables**: 5-store alpha rollout, 25-50 store beta rollout, GA launch war room checklist.
- **Exit Check**: 100 new stores onboarded in a week with zero manual engineering interventions.

---

## Step 28: Post-Launch Operations & Growth
- **Deliverables**: Daily/weekly operating rhythm, metrics dashboard (MRR, churn, CAC, WAU), long-term roadmap.
