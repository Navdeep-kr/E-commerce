# Runbook RB-12: Public REST API Rate-Limit Breach & DDoS Defense

**Severity**: P1 - CRITICAL  
**Alert Trigger**: `public_api_requests_per_second > 2000` or API 429 response rate $> 40\%$.

---

## 1. Symptoms & Impact
* High volumetric traffic directed against `/api/v1/orders` or `/api/v1/inventory`.
* Latency degradation affecting authenticated web dashboard users and standard warehouse operations.

## 2. Immediate Triage & Diagnostics
1. Analyze Cloudflare / edge reverse proxy logs:
   * Identify offending client IP ranges, ASN origin, and User-Agent headers.
2. Check API key usage metrics:
   * Determine if the surge is from an individual tenant's misconfigured script or a distributed unauthenticated attack.
3. Verify if database CPU is spiking due to costly query patterns (e.g. unindexed full-table searches).

## 3. Mitigation & Recovery Steps
1. **Engage Cloudflare Under-Attack Mode / Managed Challenge**:
   * Turn on JavaScript challenge / Turnstile on all public REST API ingress routes.
2. **Apply Tenant API Key Throttle**:
   * Temporarily throttle the offending tenant API key from standard 100 req/sec down to 10 req/sec:
     ```bash
     redis-cli SET "rate_limit:override:apiKey_test123" 10 EX 3600
     ```
3. **Block Abusive Subnets**:
   * Drop traffic at AWS WAF / edge firewall for offending IP CIDR blocks.
4. **Verify Recovery**:
   * Confirm edge request volume normalizes $< 200\text{ req/sec}$ and authenticated web dashboard latency $< 25\text{ms}$.
