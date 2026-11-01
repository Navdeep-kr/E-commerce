# Runbook RB-13: Email & SMS Notification Delivery Drop

**Severity**: P2 - HIGH  
**Alert Trigger**: `notification_bounce_rate > 5%` or delivery failure rate $> 10\%$ over 15 minutes.

---

## 1. Symptoms & Impact
* Order confirmation, tracking update, and return authorization emails or SMS messages are failing to reach customers.
* Inbound support tickets spike with "Where is my order confirmation?" queries.

## 2. Immediate Triage & Diagnostics
1. Check Resend / Twilio provider status pages for ongoing upstream provider outages.
2. Query `notification_delivery_logs` by status and failure reason:
   ```sql
   SELECT channel, failure_reason, count(*) 
   FROM notification_delivery_logs 
   WHERE status = 'failed' AND created_at > now() - interval '30 minutes'
   GROUP BY channel, failure_reason;
   ```
3. Check domain reputation and DNS records (SPF, DKIM, DMARC) for sending domains.

## 3. Mitigation & Recovery Steps
1. **Switch to Backup Delivery Provider**:
   * If primary email provider (Resend) is degraded, flip provider toggle to secondary fallback (AWS SES / SendGrid):
     ```bash
     export EMAIL_PROVIDER_ACTIVE=aws_ses
     ```
2. **Pause Bulk Marketing Batches**:
   * Immediately pause promotional email blasts to reserve sender reputation and provider rate limits exclusively for transactional order updates.
3. **Queue Failed Messages for Re-Delivery**:
   * Trigger replay job for failed transactional notifications once fallback provider is verified.
4. **Verify Recovery**:
   * Delivery success rate rebounds to $> 99\%$; bounce rate drops below $1\%$.
