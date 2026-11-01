# Runbook RB-03: Stripe Payment Webhook Outage & Reconciliation Desync

**Severity**: P2 - HIGH  
**Alert Trigger**: `stripe_webhook_unhandled_count > 10` or `payout_reconciliation_variance != 0`.

---

## 1. Symptoms & Impact
* Orders stuck in `pending` payment status despite consumer card being charged on Stripe.
* Finance payout reconciliation dashboard flags discrepancy between gross sales and bank deposit.

## 2. Immediate Triage & Diagnostics
1. Check Stripe Dashboard Webhook Delivery logs for `payment_intent.succeeded` events.
2. Check if timestamp drift in `stripe-signature` header exceeded the 300-second tolerance window due to network queue delay.

## 3. Mitigation & Recovery Steps
1. **Trigger Manual Webhook Resync**:
   * Use Stripe CLI or Stripe Dashboard: `stripe events resend evt_...`.
2. **Re-Run Double-Entry Payout Reconciler**:
   * In `/[orgSlug]/finance`, click **"Re-run Payout Reconciliation"**. Verify expected gross sales minus fees matches deposit with $0.00 variance.
3. **Verify Recovery**:
   * Order statuses automatically transition from `pending` $\to$ `paid` and commit inventory reservations.
