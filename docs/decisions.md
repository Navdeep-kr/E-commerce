# Architecture Decisions Record (ADR)

## ADR-001: Tech Stack & Architecture Baseline
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Need a scalable, high-velocity, production-grade foundation for multi-tenant e-commerce operations.
- **Decision**: 
  - Framework: Next.js (App Router, TypeScript strict).
  - UI: Tailwind CSS, shadcn/ui, TanStack Table v8, TanStack Query v5, Recharts.
  - Database: PostgreSQL with Supabase for Auth, Row-Level Security, Storage, and Realtime.
  - Background Jobs: Inngest / async queue abstraction.
  - Monorepo / modular architecture separating apps from core domain logic and third-party adapters.
- **Consequences**: Strict type safety, clean separation of concerns, pluggable third-party adapters without polluting UI components.

## ADR-002: Adapter Architecture for Integrations
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Platform must support multiple e-commerce backends (Shopify, WooCommerce), payment processors (Stripe), shipping carriers (Shippo, EasyPost), and communication providers (Resend, Twilio) interchangeably.
- **Decision**: All integrations must implement abstract interfaces (`OrdersProvider`, `InventoryProvider`, `PaymentsProvider`, `ShippingProvider`, `MessagingProvider`). Business logic in core modules calls only adapter interfaces, never raw vendor SDKs.
- **Consequences**: Adding or swapping providers requires zero changes to UI or business logic code.

## ADR-003: Append-Only Inventory Movements Ledger
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Inventory discrepancies are catastrophic for e-commerce brands. Direct arbitrary updates to stock counts lead to untraceable ghost stock.
- **Decision**: `inventory_levels` table cannot be directly updated by application mutations without an accompanying row in `inventory_movements`. Available quantity is mathematically defined as `on_hand - committed`.
- **Consequences**: Every single unit movement is permanently auditable with reason codes and reference links.

## ADR-004: Server-Side Row-Level Security (RLS) & Minor-Unit Currency
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Multi-tenant isolation and financial calculations must be bulletproof against client-side tampering and floating-point errors.
- **Decision**:
  - Every table includes `organization_id` enforced by PostgreSQL RLS.
  - All currency calculations strictly use integer minor units (e.g. cents) with ISO currency codes.
- **Consequences**: Zero floating point drift ($0.10 + $0.20 = $0.30 exact); cross-tenant data leakage is prevented at the database layer.

## ADR-005: Native Zero-Dependency Test Execution in packages/core
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: `packages/core` must remain 100% pure and independent of heavy bundlers, running lightning-fast unit tests for domain invariants.
- **Decision**: Utilize Node.js native test runner (`node --test`) with type stripping (`--experimental-strip-types`).
- **Consequences**: Zero test runner startup overhead (< 250ms for the full suite), zero external testing dependencies in `packages/core`.
