# Storefront Ops: Production Operating Rhythm & Cadence

A disciplined operational cadence ensures high platform reliability, rapid resolution of customer escalations, proactive infrastructure capacity management, and consistent SaaS financial growth.

---

## 1. Daily Operational Rhythm (15-Minute Standup)

* **Time**: 09:00 AM UTC
* **Attendees**: Lead Architect, On-Call Engineer, Fulfillment Operations Lead, Support Concierge
* **Agenda**:
  1. **Telemetry & Incident Review**: Inspect P0/P1 alerts from past 24 hours. Verify any runbook executions (`RB-01` through `RB-15`).
  2. **Queue Health & Lag**: Confirm Inngest background job lag $< 10\text{s}$ and zero stalled DLQ items.
  3. **Carrier & Hardware Status**: Review warehouse thermal printer connectivity, barcode scanner round-trip latencies ($< 50\text{ms}$), and carrier API 429 rates.
  4. **Support Ticket SLAs**: Review open urgent tickets and ensure no first response SLA breaches.

---

## 2. Weekly Operating Cadence (45-Minute Review)

* **Time**: Mondays at 14:00 UTC
* **Attendees**: Engineering Team, Product Managers, Customer Success Leads
* **Agenda**:
  1. **Capacity & Infrastructure Audit**:
     * PostgreSQL connection pool ceiling utilization (target $< 65\%$).
     * Redis cache hit ratios (target $> 85\%$).
     * Keyset pagination query latency trends ($p95 < 20\text{ms}$).
  2. **Merchant Health & Churn Triage**:
     * Review merchant health scores across cohorts.
     * Flag any accounts exhibiting declining order sync velocity or payment past_due warnings.
  3. **Security & Compliance Check**:
     * Review automated tenant boundary fuzzing reports and secret scanning logs.
     * Confirm all GDPR/CCPA erasure requests completed within 30-day statutory SLA.
  4. **Sprint Backlog Prioritization**:
     * Review top merchant feature requests and operational bug fixes.

---

## 3. Monthly Executive Business & Financial Review

* **Time**: 1st Business Day of Each Month
* **Attendees**: Executive Leadership, Head of Finance, Head of Sales, Lead Architect
* **Agenda**:
  1. **Financial Vitals Reconciliation**:
     * Reconcile gross merchant order throughput against platform SaaS subscription MRR and ARR.
     * Confirm Stripe payout ledger matches bank settlement down to 0 cents drift.
  2. **Unit Economics Review**:
     * Customer Acquisition Cost (CAC) vs. Customer Lifetime Value (LTV) (Target $LTV:CAC \ge 3:1$).
     * Gross and Net Revenue Churn (Target Net Revenue Retention $> 110\%$).
  3. **Product & Engineering Roadmap Check**:
     * Review milestone delivery against multi-quarter roadmap.
