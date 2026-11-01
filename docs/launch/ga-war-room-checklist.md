# General Availability (GA) Launch War Room Checklist & Protocol

**Status**: ACTIVE PRE-FLIGHT  
**Operational Objective**: Unrestricted public launch allowing 100+ new stores to onboard per week with **zero manual engineering interventions**.

---

## 1. T-Minus 24 Hours: Infrastructure Pre-Flight Gate

- [x] **Database Pool Ceiling**: PgBouncer pool verified at 50 connections with transaction pooling enabled.
- [x] **Cache Eviction Policy**: Redis configured with `volatile-lru` and 2GB memory ceiling. Single-flight stampede protection active.
- [x] **Database Indexes**: Compound tenant indexes verified on `(organization_id, status)`, `(organization_id, created_at DESC)`.
- [x] **Carrier API Fallbacks**: EasyPost primary credentials verified; backup USPS direct connection validated.
- [x] **Security Headers**: HSTS, CSP, X-Frame-Options, and rate-limiting active (100 req/s per API key).
- [x] **Telemetry & Alert Rules**: All 15 alert rules loaded; P0/P1/P2 paging webhooks verified to Slack and PagerDuty.

---

## 2. Launch War Room On-Call Roster

| Role | Primary Engineer | Secondary Engineer | Escalation Channel |
| :--- | :--- | :--- | :--- |
| **Incident Commander** | Lead Systems Architect | VP of Engineering | `#war-room-ops` |
| **Backend & Database** | Senior Database Lead | Core Engine Engineer | `#war-room-db` |
| **Fulfillment & Hardware** | Warehouse Systems Lead | Integrations Engineer | `#war-room-fulfillment` |
| **Customer Success** | Lead Support Concierge | Customer Operations | `#war-room-support` |

---

## 3. Incident Severity & Escalation Tree

* **P0 (Critical Security / Outage)**: Immediate page to Incident Commander within 5 minutes.
  * *Trigger*: Cross-tenant RLS violation attempt (`RB-08`), zero-downtime cutover failure, or global database lock.
  * *Remediation*: Follow runbook immediately; session invalidation or automatic rollback.
* **P1 (High Operational Impact)**: Page on-call engineer within 15 minutes.
  * *Trigger*: Database pool utilization $> 90\%$ (`RB-01`), Stripe webhook lag $> 15\text{m}$ (`RB-03`), or inventory deadlock (`RB-05`).
* **P2 (Degraded Performance)**: Address within 1 hour.
  * *Trigger*: Carrier rate-limit 429 surges (`RB-04`), Inngest queue lag $> 5\text{m}$ (`RB-06`), cache eviction surge (`RB-07`).

---

## 4. Exit Check: Zero Manual Engineering Intervention Mandate

To satisfy the GA readiness standard:
1. **Automated Tenant Provisioning**: 100 new stores onboarded in a week through the self-serve wizard.
2. **Zero Engineering Code Modifications**: All provisioning, webhook establishment, catalog syncs, and financial postings occur automatically via microservice pipelines without engineering touching production databases or source code.
