# Runbook RB-06: Inngest Job Queue Backlog & Processing Stall

**Severity**: P2 - HIGH  
**Alert Trigger**: `queue_lag_seconds > 300` (5 minutes) or `unprocessed_jobs_count > 1000`.

---

## 1. Symptoms & Impact
* Order sync, shipment tracking updates, and webhook ingestion tasks are delayed by $> 5$ minutes.
* Users report delayed order confirmation emails or inventory sync lag.

## 2. Immediate Triage & Diagnostics
1. Check Inngest dashboard / job execution metrics:
   * Identify stalled functions (`orders/process-sync`, `inventory/recompute-velocity`).
2. Inspect worker concurrency limits and error rates:
   * Look for unhandled promise rejections or rate-limiting backoffs causing jobs to be continually rescheduled.
3. Check PostgreSQL connection health for background worker pool.

## 3. Mitigation & Recovery Steps
1. **Temporarily Scale Concurrency**:
   * Increase Inngest worker step concurrency ceiling from 25 to 100 in worker deployment settings.
2. **Prioritize Critical Ingestion Pipelines**:
   * Throttle low-priority analytics batch jobs (`analytics/hourly-rollups`) to give full capacity to `orders/checkout-intake`.
3. **Flush Poison-Pill Jobs**:
   * Move repeatedly failing jobs (retried $> 5$ times with invariant errors) to dead-letter queue (DLQ) for asynchronous inspection.
4. **Verify Recovery**:
   * Confirm queue depth drops below 50 jobs and end-to-end processing lag $< 10\text{ seconds}$.
