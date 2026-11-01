# Runbook RB-04: Carrier API Rate Limit Breach & Fallback Routing

**Severity**: P2 - HIGH  
**Alert Trigger**: `carrier_rate_limit_429_count > 15` in 5 minutes.

---

## 1. Symptoms & Impact
* Fulfillment pack stations fail to generate shipping labels; carrier API responds with `429 Too Many Requests`.
* Warehouse pack station displays `Carrier Gateway Throttled`.

## 2. Immediate Triage & Diagnostics
1. Determine which carrier endpoint breached rate limits (USPS, UPS, or FedEx).
2. Check if a high-volume batch print job was initiated without rate-limiting spacing.

## 3. Mitigation & Recovery Steps
1. **Activate Secondary Carrier Failover**:
   * Switch default rate-shopping routing rule to secondary carrier (e.g., failover from UPS to FedEx Ground).
2. **Throttle Batch Queue**:
   * Set Inngest queue concurrency limit to 5 concurrent label generation workers with exponential backoff jitter.
3. **Verify Recovery**:
   * Pack stations resume 1-click label generation in $< 30\text{s}$.
