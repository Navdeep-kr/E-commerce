# Runbook RB-08: Cross-Tenant RLS Violation Alert

**Severity**: P0 - CRITICAL SECURITY EVENT  
**Alert Trigger**: `security_cross_tenant_access_attempt > 0` or PostgreSQL RLS security violation detected in application logs.

---

## 1. Symptoms & Impact
* An authenticated session from Tenant A attempted to query, modify, or inspect records belonging to Tenant B.
* Automated tenant boundary fuzzer or application firewall flagged unauthorized `organization_id` mismatch.

## 2. Immediate Triage & Diagnostics
1. Identify the origin IP, session token, and user ID triggering the violation:
   ```json
   {
     "event": "rls_violation_attempt",
     "tenant_actor": "org_tenant_a",
     "target_tenant": "org_tenant_b",
     "route": "/api/orders/ord_99812",
     "ip": "203.0.113.42"
   }
   ```
2. Verify if data was exfiltrated: inspect database audit trail for completed response payload size and status code (must be 403 / 404).
3. Review whether the request came from an external API token or a web UI session.

## 3. Mitigation & Recovery Steps
1. **Immediate Session Invalidation**:
   * Revoke the offending user session or rotate compromised API keys immediately via `SuperAdminService`.
2. **Apply IP Rate-Limiting / Block**:
   * Add offending IP address to Cloudflare / AWS WAF blocklist if hostile penetration activity is detected.
3. **Patch Application Boundary**:
   * Audit the endpoint for any missing `organization_id` WHERE clause or RLS bypass context.
4. **Notify Incident Response Team**:
   * Convene security response team within 15 minutes; prepare tenant disclosure notice if required by GDPR Art. 33/34.
5. **Verify Recovery**:
   * Verify all subsequent requests for the target tenant return 403 Forbidden and zero records are leaked.
