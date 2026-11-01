# Runbook RB-11: GDPR / CCPA Erasure Request Failure

**Severity**: P2 - HIGH  
**Alert Trigger**: `gdpr_erasure_job_status == 'failed'` or request pending $> 25\text{ days}$ (30-day statutory SLA).

---

## 1. Symptoms & Impact
* Customer "Right to be Forgotten" (Article 17) request failed to scrub customer PII across one or more data stores.
* Risk of statutory non-compliance penalty under GDPR / CCPA regulations.

## 2. Immediate Triage & Diagnostics
1. Inspect the failed erasure execution record:
   ```json
   {
     "erasure_id": "ers_10294",
     "customer_id": "cust_8819",
     "failed_step": "scrub_support_tickets",
     "error": "database foreign key constraint violation on tickets_assigned_user_id"
   }
   ```
2. Check which systems were partially updated (customers, orders, tickets, communications).

## 3. Mitigation & Recovery Steps
1. **Identify Blocked Foreign Key / Dependent Resource**:
   * Verify foreign keys allow anonymization updates (`SET NULL` or updated to anonymized identifier `DELETED_USER_cust_8819`).
2. **Execute Remediation Script**:
   * Run targeted privacy scrub via `PrivacyService.executeErasureRequest(requestId)` with force retry.
3. **Audit Financial Immutability**:
   * Verify customer name and email are anonymized to `[REDACTED]`, while order financial amounts and line item costs remain strictly preserved for tax compliance.
4. **Issue Confirmation Notice**:
   * Record completion certificate in `privacy_compliance_logs` and notify compliance DPO.
5. **Verify Recovery**:
   * Verify querying customer email returns zero active PII records.
