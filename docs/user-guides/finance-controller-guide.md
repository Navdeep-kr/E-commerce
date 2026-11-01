# Storefront Ops: Finance Controller Guide

This guide details financial operations, double-entry bookkeeping ledgers, Stripe bank payout reconciliations, statutory tax reporting, and profit & loss statements.

---

## 1. Double-Entry General Ledger

Storefront Ops enforces an append-only double-entry general ledger. Every operational event creates balanced journal entries where:
$$\sum \text{Debits} = \sum \text{Credits}$$

### Standard Chart of Accounts
* `1010` - Cash & Bank Deposits (Asset)
* `1020` - Stripe Clearing Account (Asset)
* `1200` - Inventory Asset at Landed Cost (Asset)
* `2010` - Accounts Payable (Liability)
* `2050` - Sales Tax Payable (Liability)
* `4010` - Gross Merchandise Sales (Revenue)
* `5010` - Cost of Goods Sold (COGS) (Expense)
* `5020` - Payment Processing Fees (Expense)
* `5030` - Shipping & Fulfillment Expense (Expense)

---

## 2. Daily Stripe Payout & Bank Reconciliation

When Stripe settles funds to your merchant bank account:
1. Navigate to `Finance -> Bank Reconciliation`.
2. Select payout transaction ID (`po_stripe_...`).
3. Storefront Ops performs 3-way matching:
   * Gross customer charges.
   * Less merchant refunds.
   * Less Stripe processing fees.
   * Net bank deposit amount.
4. If drift is 0 cents, click **Reconcile & Close Settlement Batch**.
5. If variance occurs, review runbook `RB-10: Payout Reconciliation Drift` for automated replay instructions.

---

## 3. Real-Time Profit & Loss (P&L) Statement

Open `Finance -> Reports -> Profit & Loss`:
* View live financial totals calculated strictly from integer cents without floating-point errors.
* Click any financial line item (e.g. Net Sales, Shipping Costs, COGS) to drill down into underlying order transactions and inventory movement IDs.
* Export statutory tax audit reports formatted for standard GAAP / IFRS filings.
