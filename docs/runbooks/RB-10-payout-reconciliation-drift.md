# Runbook RB-10: Payout Reconciliation Drift & Financial Imbalance

**Severity**: P1 - CRITICAL  
**Alert Trigger**: `payout_ledger_drift_cents > 0` during daily midnight settlement reconciliation.

---

## 1. Symptoms & Impact
* Discrepancy detected between Stripe bank payouts, recorded customer order revenues, merchant refunds, and transaction fee deductions.
* Finance team cannot close daily ledger books.

## 2. Immediate Triage & Diagnostics
1. Query `finance_reconciliation_audit` table to pinpoint variance by transaction ID:
   ```sql
   SELECT transaction_id, stripe_gross_cents, recorded_order_cents, stripe_fee_cents, discrepancy_cents 
   FROM finance_reconciliation_audit 
   WHERE discrepancy_cents <> 0;
   ```
2. Check for multi-currency conversion rounding issues:
   * Verify all FX conversions were executed using fixed 4-decimal exchange rates converted to integer cents without floating-point math.
3. Check for late-arriving chargeback disputes or refund adjustments not yet ingested.

## 3. Mitigation & Recovery Steps
1. **Replay Stripe Balance Transactions**:
   * Run sync job `finance/sync-stripe-balance-transactions` for the affected payout date range.
2. **Post Adjustment Entry**:
   * Generate an automated balancing ledger entry flagged as `RECONCILIATION_ADJUSTMENT` with audit reason.
3. **Notify Finance Controller**:
   * Send automated variance summary report to finance controller and tenant account owner.
4. **Verify Recovery**:
   * Ledger sum strictly equals bank settlement payout sum down to 0 cents drift.
