import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PurchasingService,
  FinanceService,
  type PoLineItem,
  type ReorderItemInput,
  type LedgerTransaction,
  type PayoutReconciliationInput,
} from '../src/index.ts';

describe('Step 11: Purchasing & Finance Modules', () => {
  describe('PurchasingService & Landed Cost Engine', () => {
    test('allocates landed freight/duty costs proportionally by value without penny drift', () => {
      const lines: PoLineItem[] = [
        { id: 'l-1', sku: 'HOODIE-BLK-M', title: 'Hoodie M', quantityOrdered: 50, quantityReceived: 50, unitCostMinor: 2000 }, // $1,000.00
        { id: 'l-2', sku: 'TEE-WHT-L', title: 'Tee L', quantityOrdered: 100, quantityReceived: 100, unitCostMinor: 800 }, // $800.00
        { id: 'l-3', sku: 'CAP-NAVY-OS', title: 'Cap OS', quantityOrdered: 20, quantityReceived: 20, unitCostMinor: 1000 }, // $200.00
      ];

      // Total PO Goods Value: $2,000.00 (200,000 cents)
      // Total Landed Freight + Customs: $350.75 (35,075 cents)
      const allocated = PurchasingService.allocateLandedCost(lines, 35075, 'value');

      // Verify that the sum of allocated amounts equals the exact total landed cost (zero rounding loss)
      const sumAllocated = allocated.reduce((acc, it) => acc + it.allocatedLandedMinor, 0);
      assert.equal(sumAllocated, 35075);

      // Verify individual line item landed costs are higher than base unit cost
      for (const item of allocated) {
        assert.ok(item.landedUnitCostMinor > item.baseUnitCostMinor);
      }
    });

    test('generates reorder recommendations respecting lead time, velocity, and supplier MOQ', () => {
      const items: ReorderItemInput[] = [
        {
          sku: 'HOODIE-BLK-XL',
          title: 'Hoodie Black XL',
          availableStock: 5,
          incomingStock: 0,
          dailyVelocity: 4, // Sells 4 units/day
          leadTimeDays: 14, // 56 units lead time demand
          safetyStockDays: 7, // 28 units safety stock
          supplierMoq: 100, // MOQ is 100
          unitCostMinor: 2500,
        },
        {
          sku: 'SOCKS-GRY',
          title: 'Wool Socks',
          availableStock: 500,
          incomingStock: 0,
          dailyVelocity: 2,
          leadTimeDays: 7,
          safetyStockDays: 7,
          supplierMoq: 50,
          unitCostMinor: 400,
        },
      ];

      const recommendations = PurchasingService.calculateReorderRecommendations(items);

      // Hoodie XL is in deficit: Target = 56 + 28 = 84 units. Current = 5. Deficit = 79.
      // Must round up to satisfy supplier MOQ of 100!
      const hoodieRec = recommendations.find((r) => r.sku === 'HOODIE-BLK-XL');
      assert.ok(hoodieRec);
      assert.equal(hoodieRec?.reorderQuantity, 100);
      assert.equal(hoodieRec?.urgency, 'critical'); // Available stock (5) <= 2 days velocity (8)

      // Socks has plenty of stock (500 > 28 target), so reorder is 0
      const socksRec = recommendations.find((r) => r.sku === 'SOCKS-GRY');
      assert.ok(socksRec);
      assert.equal(socksRec?.reorderQuantity, 0);
      assert.equal(socksRec?.urgency, 'healthy');
    });

    test('validates PO status machine transitions', () => {
      assert.equal(PurchasingService.canTransition('draft', 'sent'), true);
      assert.equal(PurchasingService.canTransition('sent', 'confirmed'), true);
      assert.equal(PurchasingService.canTransition('confirmed', 'received'), true);
      assert.equal(PurchasingService.canTransition('received', 'closed'), true);

      // Invalid jumps
      assert.equal(PurchasingService.canTransition('draft', 'received'), false);
      assert.equal(PurchasingService.canTransition('closed', 'draft'), false);
    });
  });

  describe('FinanceService, Double-Entry Ledger & P&L', () => {
    test('enforces strict double-entry balance where sum(debits) === sum(credits)', () => {
      const balancedTx: LedgerTransaction = {
        id: 'tx-1',
        entryNumber: 'JE-1001',
        occurredAtIso: '2026-11-01T10:00:00Z',
        description: 'Customer order payment via Stripe',
        category: 'revenue',
        lines: [
          { accountId: 'acc-cash', accountName: 'Stripe Clearing Account', debitMinor: 14200, creditMinor: 0 },
          { accountId: 'acc-rev', accountName: 'Sales Revenue', debitMinor: 0, creditMinor: 14200 },
        ],
      };

      const result = FinanceService.validateDoubleEntry(balancedTx);
      assert.equal(result.isValid, true);
      assert.equal(result.differenceMinor, 0);

      const unbalancedTx: LedgerTransaction = {
        id: 'tx-2',
        entryNumber: 'JE-1002',
        occurredAtIso: '2026-11-01T10:05:00Z',
        description: 'Erroneous unbalanced entry',
        category: 'shipping',
        lines: [
          { accountId: 'acc-exp', accountName: 'Shipping Expense', debitMinor: 850, creditMinor: 0 },
          { accountId: 'acc-cash', accountName: 'Cash', debitMinor: 0, creditMinor: 750 }, // 100 cents off!
        ],
      };

      const badResult = FinanceService.validateDoubleEntry(unbalancedTx);
      assert.equal(badResult.isValid, false);
      assert.equal(badResult.differenceMinor, 100);
    });

    test('reconciles bank payout deposits against gross sales, refunds, and fees', () => {
      const input: PayoutReconciliationInput = {
        payoutId: 'po_stripe_20261101',
        bankDepositMinor: 485000, // $4,850.00 received in bank
        grossSalesMinor: 520000, // $5,200.00 gross sales
        refundsMinor: 20000, // $200.00 customer refunds
        processorFeesMinor: 15000, // $150.00 Stripe processing fees
        adjustmentsMinor: 0,
      };

      // Expected: 520,000 - 20,000 - 15,000 = 485,000 cents
      const reconciliation = FinanceService.reconcilePayout(input);
      assert.equal(reconciliation.reconciled, true);
      assert.equal(reconciliation.discrepancyMinor, 0);
      assert.equal(reconciliation.status, 'matched');
    });

    test('Exit Check: P&L matches independent spreadsheet calculation down to the cent with full transaction drill-down', () => {
      // Independent benchmark dataset:
      // Gross Sales: $150,000.00 (15,000,000 cents)
      // Returns & Allowances: $6,200.00 (620,000 cents)
      // COGS: $58,400.00 (5,840,000 cents)
      // Shipping Expense: $12,300.00 (1,230,000 cents)
      // Processor Fees: $4,350.00 (435,000 cents)
      // Ad Spend: $22,000.00 (2,200,000 cents)
      //
      // Expected Independent Spreadsheet Results:
      // Net Sales = 15,000,000 - 620,000 = 14,380,000 cents ($143,800.00)
      // Gross Profit = 14,380,000 - 5,840,000 = 8,540,000 cents ($85,400.00)
      // Gross Margin % = 8,540,000 / 14,380,000 = 59.387% = 5939 bps
      // Total OpEx = 1,230,000 + 435,000 + 2,200,000 = 3,865,000 cents ($38,650.00)
      // Net Operating Income (NOI) = 8,540,000 - 3,865,000 = 4,675,000 cents ($46,750.00)

      const transactions: LedgerTransaction[] = [
        {
          id: 'tx-rev-1',
          entryNumber: 'JE-REV-01',
          occurredAtIso: '2026-10-15T00:00:00Z',
          description: 'Gross Sales Oct 1-15',
          category: 'revenue',
          lines: [
            { accountId: '101', accountName: 'Cash', debitMinor: 15000000, creditMinor: 0 },
            { accountId: '401', accountName: 'Sales Revenue', debitMinor: 0, creditMinor: 15000000 },
          ],
        },
        {
          id: 'tx-ref-1',
          entryNumber: 'JE-REF-01',
          occurredAtIso: '2026-10-18T00:00:00Z',
          description: 'Customer Returns & Refunds',
          category: 'refund',
          lines: [
            { accountId: '402', accountName: 'Returns & Allowances', debitMinor: 620000, creditMinor: 0 },
            { accountId: '101', accountName: 'Cash', debitMinor: 0, creditMinor: 620000 },
          ],
        },
        {
          id: 'tx-cogs-1',
          entryNumber: 'JE-COGS-01',
          occurredAtIso: '2026-10-31T00:00:00Z',
          description: 'Cost of Goods Sold',
          category: 'cogs',
          lines: [
            { accountId: '501', accountName: 'COGS', debitMinor: 5840000, creditMinor: 0 },
            { accountId: '120', accountName: 'Inventory Asset', debitMinor: 0, creditMinor: 5840000 },
          ],
        },
        {
          id: 'tx-ship-1',
          entryNumber: 'JE-SHIP-01',
          occurredAtIso: '2026-10-31T00:00:00Z',
          description: 'Carrier Shipping Costs (USPS/UPS)',
          category: 'shipping',
          lines: [
            { accountId: '601', accountName: 'Shipping Expense', debitMinor: 1230000, creditMinor: 0 },
            { accountId: '101', accountName: 'Cash', debitMinor: 0, creditMinor: 1230000 },
          ],
        },
        {
          id: 'tx-fees-1',
          entryNumber: 'JE-FEE-01',
          occurredAtIso: '2026-10-31T00:00:00Z',
          description: 'Stripe Merchant Fees',
          category: 'processor_fee',
          lines: [
            { accountId: '602', accountName: 'Merchant Fees', debitMinor: 435000, creditMinor: 0 },
            { accountId: '101', accountName: 'Cash', debitMinor: 0, creditMinor: 435000 },
          ],
        },
        {
          id: 'tx-ad-1',
          entryNumber: 'JE-AD-01',
          occurredAtIso: '2026-10-31T00:00:00Z',
          description: 'Meta & Google Ads Campaign Spend',
          category: 'ad_spend',
          lines: [
            { accountId: '603', accountName: 'Advertising Expense', debitMinor: 2200000, creditMinor: 0 },
            { accountId: '101', accountName: 'Cash', debitMinor: 0, creditMinor: 2200000 },
          ],
        },
      ];

      const pnl = FinanceService.compilePnL(transactions, 'October 2026', 'USD');

      // EXACT INTEGER CENT ASSERTIONS (Zero floating point errors, zero penny discrepancy)
      assert.equal(pnl.revenue.grossSalesMinor, 15000000);
      assert.equal(pnl.revenue.returnsAllowancesMinor, 620000);
      assert.equal(pnl.revenue.netSalesMinor, 14380000); // $143,800.00
      assert.equal(pnl.cogs.totalCogsMinor, 5840000); // $58,400.00
      assert.equal(pnl.grossProfitMinor, 8540000); // $85,400.00
      assert.equal(pnl.grossMarginBps, 5939); // 59.39%
      assert.equal(pnl.operatingExpenses.totalOpExMinor, 3865000); // $38,650.00
      assert.equal(pnl.netOperatingIncomeMinor, 4675000); // $46,750.00

      // VERIFY FULL TRANSACTION DRILL-DOWN CAPABILITY
      const grossRevLine = pnl.lineItems.find((l) => l.key === 'gross_revenue');
      assert.ok(grossRevLine);
      assert.deepEqual(grossRevLine?.transactionIds, ['tx-rev-1']);

      const cogsLine = pnl.lineItems.find((l) => l.key === 'cogs');
      assert.ok(cogsLine);
      assert.deepEqual(cogsLine?.transactionIds, ['tx-cogs-1']);

      const adLine = pnl.lineItems.find((l) => l.key === 'ad_spend');
      assert.ok(adLine);
      assert.deepEqual(adLine?.transactionIds, ['tx-ad-1']);
    });
  });
});
