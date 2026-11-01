# Staged Rollout Playbook: Phase 2 (Beta 25–50 Store Expansion)

**Target Capacity**: 25 to 50 merchants  
**Rollout Goal**: Transition from high-touch white-glove onboarding to 100% automated self-serve onboarding. Stress-test multi-tenant PostgreSQL Row-Level Security (RLS) under concurrent load.

---

## 1. Beta Cohort Composition

* Cohort A (Stores 6–20): Apparel & Fashion (multi-variant sizing, barcode-heavy packing).
* Cohort B (Stores 21–35): Consumer Packaged Goods (expiry dates, lot tracking).
* Cohort C (Stores 36–50): Electronics & High-Value Goods (serial numbers, strict RMA return inspection).

---

## 2. Automated Self-Serve Onboarding Flow

1. Merchant signs up via public marketing landing page or Shopify App Store listing.
2. In-app onboarding wizard guides merchant through 6 milestone checklist steps in $< 30\text{ minutes}$ unassisted.
3. System automatically sets up tenant-isolated schemas with Row-Level Security, seeds default carrier packaging presets, and activates webhook listeners.
4. Anomaly detection monitors track initial order velocity and flag any sync delays.

---

## 3. Exit Gates to General Availability (GA)

* Total Beta volume exceeds 10,000 completed orders.
* 100% of tenants onboarded without manual engineering code patches or hotfixes.
* Peak load benchmark: system sustains 50 concurrent orders/sec with $p95 < 50\text{ms}$.
* System uptime $\ge 99.95\%$ during beta test window.
* All 15 operational runbooks validated against synthetic staging injects.
