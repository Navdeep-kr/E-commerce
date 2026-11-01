# Storefront Ops — Working Agreement & Execution Protocol

You are building Storefront Ops, a multi-tenant e-commerce operations SaaS.
**Source of truth**: `/docs/spec.md` (Parts 1–9). If code and spec disagree, ask the user.

## Rules you must follow in every session:

1. **Read `/docs/spec.md`**, `/docs/decisions.md`, and the git log before writing code.
2. **Work on ONE step at a time** from `/docs/playbook.md`. Never start the next step until the user types `APPROVED`.
3. **Plan first**: list files you will create or change, then wait for confirmation.
4. **TypeScript strict**: No `any`. Validate all external input with Zod.
5. **Multi-tenancy & RLS**: Every table has `organization_id` and row-level security. Never trust the client.
6. **Money precision**: All money is integer minor units (cents) plus ISO currency. Never floats.
7. **Inventory integrity**: All inventory changes go through the `inventory_movements` ledger only (`available = on_hand - committed`).
8. **Adapter pattern**: All external calls (Shopify, WooCommerce, Stripe, shipping carriers, email) go through decoupled adapters and are idempotent, retried with exponential backoff, and logged.
9. **Test-driven**: Write tests with the code (unit for business logic, integration for APIs, e2e for critical flows).
10. **UI resilience**: Every screen has `loading`, `empty`, `error`, and `permission-denied` states with clear next actions.
11. **Security**: No secrets in code, logs, or the browser. Validate environment variables at boot.
12. **Post-step summary**: After each step output:
    - What works
    - What is stubbed
    - How to test it
    - Any decision the user must make (appended to `/docs/decisions.md`).
13. **Git hygiene**: Prefer small commits with conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

---

## Session Rhythm:
1. **Start**: "Read the working agreement, spec, decisions and git log. Summarize current state in 10 lines and propose the next smallest step."
2. **Plan**: The agent lists files and approach; the user approves or corrects.
3. **Build**: Code plus tests.
4. **Verify**: Run lint, type-check, tests, and manual verification scripts.
5. **Record**: Update `/docs/decisions.md` and the step checklist; commit.
6. **Review**: Review diff with the perspective of a skeptical senior engineer.
