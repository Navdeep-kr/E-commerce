import { NextResponse } from 'next/server';
import { FinanceService, type LedgerTransaction } from '@storefront-ops/core';

export async function GET() {
  const transactions: LedgerTransaction[] = [
    {
      id: 'tx-rev-101',
      entryNumber: 'JE-REV-01',
      occurredAtIso: '2026-10-15T00:00:00Z',
      description: 'E-Commerce Online Store Sales (Shopify/Stripe)',
      category: 'revenue',
      lines: [
        { accountId: '101', accountName: 'Stripe Settlement Account', debitMinor: 14850000, creditMinor: 0 },
        { accountId: '401', accountName: 'Product Sales Revenue', debitMinor: 0, creditMinor: 14850000 },
      ],
    },
    {
      id: 'tx-rev-102',
      entryNumber: 'JE-REV-02',
      occurredAtIso: '2026-10-25T00:00:00Z',
      description: 'Wholesale B2B Order Settlement',
      category: 'revenue',
      lines: [
        { accountId: '102', accountName: 'Bank Operating Account', debitMinor: 2500000, creditMinor: 0 },
        { accountId: '402', accountName: 'Wholesale Revenue', debitMinor: 0, creditMinor: 2500000 },
      ],
    },
    {
      id: 'tx-ref-101',
      entryNumber: 'JE-REF-01',
      occurredAtIso: '2026-10-28T00:00:00Z',
      description: 'Customer Returns & Order Refunds',
      category: 'refund',
      lines: [
        { accountId: '403', accountName: 'Returns & Allowances', debitMinor: 680000, creditMinor: 0 },
        { accountId: '101', accountName: 'Stripe Settlement Account', debitMinor: 0, creditMinor: 680000 },
      ],
    },
    {
      id: 'tx-cogs-101',
      entryNumber: 'JE-COGS-01',
      occurredAtIso: '2026-10-31T00:00:00Z',
      description: 'Inventory Cost of Sold Items (Weighted Average)',
      category: 'cogs',
      lines: [
        { accountId: '501', accountName: 'Cost of Goods Sold (COGS)', debitMinor: 6250000, creditMinor: 0 },
        { accountId: '120', accountName: 'Inventory Asset', debitMinor: 0, creditMinor: 6250000 },
      ],
    },
    {
      id: 'tx-ship-101',
      entryNumber: 'JE-SHIP-01',
      occurredAtIso: '2026-10-31T00:00:00Z',
      description: 'USPS & UPS Outbound Postage Costs',
      category: 'shipping',
      lines: [
        { accountId: '601', accountName: 'Freight & Outbound Shipping Expense', debitMinor: 1420000, creditMinor: 0 },
        { accountId: '101', accountName: 'Cash', debitMinor: 0, creditMinor: 1420000 },
      ],
    },
    {
      id: 'tx-fee-101',
      entryNumber: 'JE-FEE-01',
      occurredAtIso: '2026-10-31T00:00:00Z',
      description: 'Stripe & PayPal Merchant Processing Fees (2.9% + 30c)',
      category: 'processor_fee',
      lines: [
        { accountId: '602', accountName: 'Payment Processor Fees', debitMinor: 512000, creditMinor: 0 },
        { accountId: '101', accountName: 'Stripe Settlement Account', debitMinor: 0, creditMinor: 512000 },
      ],
    },
    {
      id: 'tx-ad-101',
      entryNumber: 'JE-AD-01',
      occurredAtIso: '2026-10-31T00:00:00Z',
      description: 'Meta Ads & Google Shopping Paid Customer Acquisition',
      category: 'ad_spend',
      lines: [
        { accountId: '603', accountName: 'Digital Advertising Expense', debitMinor: 2850000, creditMinor: 0 },
        { accountId: '102', accountName: 'Bank Operating Account', debitMinor: 0, creditMinor: 2850000 },
      ],
    },
  ];

  const pnl = FinanceService.compilePnL(transactions, 'October 2026', 'USD');

  return NextResponse.json({
    pnl,
    transactions,
  });
}
