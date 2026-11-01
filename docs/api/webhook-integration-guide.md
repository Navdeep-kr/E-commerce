# Storefront Ops: Webhooks & Event Integration Guide

Webhooks deliver real-time notifications to your external systems whenever critical events occur in your Storefront Ops workspace (e.g., `order.created`, `order.shipped`, `inventory.low_stock`).

---

## 1. Supported Event Types

| Event Name | Trigger Condition |
| :--- | :--- |
| `order.created` | Inbound order received and stock reserved. |
| `order.shipped` | Order labeled and marked shipped with carrier tracking info. |
| `order.delivered` | Carrier webhook confirms final customer delivery. |
| `inventory.low_stock` | SKU available inventory drops below configured reorder threshold. |
| `return.requested` | Customer submits RMA return authorization request. |
| `return.refunded` | Return received at dock and refund credited. |

---

## 2. Cryptographic Security & HMAC-SHA256 Verification

Every outbound webhook request includes an HMAC signature in the `X-StorefrontOps-Signature` header computed using your endpoint's shared webhook signing secret.

### Verification Example (Node.js / TypeScript)

```typescript
import crypto from 'node:crypto';

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(rawBody, 'utf8').digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
```

---

## 3. Idempotency & Delivery Guarantees

* **At-Least-Once Delivery**: Events are dispatched with an `idempotency_key` (UUID v4) in the payload. Your consumer should record processed keys to prevent double-processing.
* **Automatic Retries**: If your server returns an HTTP status other than `2xx`, Storefront Ops automatically retries with exponential backoff:
  * Attempt 1: Immediate
  * Attempt 2: After 30 seconds
  * Attempt 3: After 5 minutes
  * Attempt 4: After 30 minutes
  * Attempt 5: After 2 hours
* After 5 failed attempts, the message moves to the workspace Dead-Letter Queue (DLQ).
