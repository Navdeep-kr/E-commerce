# Runbook RB-02: Shopify Webhook Signature Failures & DLQ Accumulation

**Severity**: P2 - HIGH  
**Alert Trigger**: `shopify_webhook_verification_failure_rate > 5%` or `dlq_items_count > 25`.

---

## 1. Symptoms & Impact
* Incoming Shopify order webhooks failing with `401 Unauthorized: HMAC signature mismatch`.
* Orders placed on Shopify store do not synchronize to Storefront Ops.

## 2. Immediate Triage & Diagnostics
1. Check webhook headers for `X-Shopify-Hmac-Sha256` and `X-Shopify-Shop-Domain`.
2. Inspect Dead Letter Queue (DLQ) in `/[orgSlug]/integrations`.
3. Verify if merchant recently rotated their Shopify Admin API credentials or private app secret.

## 3. Mitigation & Recovery Steps
1. **Enable Dual-Secret Rotation**:
   * Update environment variables to include both `SHOPIFY_WEBHOOK_SECRET_OLD` and `SHOPIFY_WEBHOOK_SECRET_NEW` to allow graceful rolling cutover.
2. **Replay Dead Letter Queue**:
   * Navigate to `/[orgSlug]/integrations` and click **"Replay DLQ Items"** or invoke `POST /api/integrations/dlq/replay`.
3. **Verify Recovery**:
   * Verify all pending orders ingest cleanly with 0 duplicate orders (idempotency key `${orderId}:${eventId}`).
