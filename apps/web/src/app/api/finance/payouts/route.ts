import { NextResponse } from 'next/server';
import { FinanceService, type PayoutReconciliationInput } from '@storefront-ops/core';

export async function GET() {
  const payouts: PayoutReconciliationInput[] = [
    {
      payoutId: 'po_stripe_20261031',
      bankDepositMinor: 13658000, // $136,580.00
      grossSalesMinor: 14850000, // $148,500.00
      refundsMinor: 680000, // $6,800.00
      processorFeesMinor: 512000, // $5,120.00
      adjustmentsMinor: 0,
    },
    {
      payoutId: 'po_stripe_20261024',
      bankDepositMinor: 11840000, // $118,400.00
      grossSalesMinor: 12890000,
      refundsMinor: 610000,
      processorFeesMinor: 440000,
      adjustmentsMinor: 0,
    },
  ];

  const reconciledList = payouts.map((p) => {
    const res = FinanceService.reconcilePayout(p);
    return {
      ...p,
      reconciliation: res,
    };
  });

  return NextResponse.json({ payouts: reconciledList });
}
