/**
 * Storefront Ops Core: Finance, Accounting & P&L Engine
 * Playbook Step 11 (Spec Part 3.12): Double-entry ledger, P&L compilation with drill-downs, and payout reconciliation
 */

export interface LedgerEntryLine {
  accountId: string;
  accountName: string;
  debitMinor: number;
  creditMinor: number;
}

export interface LedgerTransaction {
  id: string;
  entryNumber: string;
  occurredAtIso: string;
  description: string;
  category: 'revenue' | 'refund' | 'cogs' | 'shipping' | 'processor_fee' | 'ad_spend' | 'supplier_payment';
  lines: LedgerEntryLine[];
}

export interface PnLLineItem {
  key: string;
  name: string;
  amountMinor: number;
  currency: string;
  transactionIds: string[];
  subLines?: PnLLineItem[];
}

export interface PnLStatement {
  period: string;
  currency: string;
  revenue: {
    grossSalesMinor: number;
    returnsAllowancesMinor: number;
    netSalesMinor: number;
  };
  cogs: {
    totalCogsMinor: number;
  };
  grossProfitMinor: number;
  grossMarginBps: number;
  operatingExpenses: {
    shippingFulfillmentMinor: number;
    paymentProcessorFeesMinor: number;
    advertisingSpendMinor: number;
    warehouseGeneralOpsMinor: number;
    totalOpExMinor: number;
  };
  netOperatingIncomeMinor: number;
  netMarginBps: number;
  lineItems: PnLLineItem[];
}

export interface PayoutReconciliationInput {
  payoutId: string;
  bankDepositMinor: number;
  grossSalesMinor: number;
  refundsMinor: number;
  processorFeesMinor: number;
  adjustmentsMinor: number;
}

export class FinanceService {
  /**
   * Validate double-entry transaction invariants:
   * Rule: sum(debitMinor) must strictly equal sum(creditMinor)
   */
  static validateDoubleEntry(entry: LedgerTransaction): {
    isValid: boolean;
    totalDebitsMinor: number;
    totalCreditsMinor: number;
    differenceMinor: number;
  } {
    let totalDebitsMinor = 0;
    let totalCreditsMinor = 0;

    for (const line of entry.lines) {
      if (!Number.isInteger(line.debitMinor) || line.debitMinor < 0) {
        throw new Error(`Debit amount must be non-negative integer minor units: got ${line.debitMinor}`);
      }
      if (!Number.isInteger(line.creditMinor) || line.creditMinor < 0) {
        throw new Error(`Credit amount must be non-negative integer minor units: got ${line.creditMinor}`);
      }
      totalDebitsMinor += line.debitMinor;
      totalCreditsMinor += line.creditMinor;
    }

    const differenceMinor = totalDebitsMinor - totalCreditsMinor;
    const isValid = differenceMinor === 0;

    return {
      isValid,
      totalDebitsMinor,
      totalCreditsMinor,
      differenceMinor,
    };
  }

  /**
   * Compile a Real-time P&L Statement from individual ledger transactions
   * Maintains exact mapping of transaction IDs for click-to-drill-down capability
   */
  static compilePnL(
    transactions: LedgerTransaction[],
    period: string = 'Trailing 30 Days',
    currency: string = 'USD'
  ): PnLStatement {
    let grossSalesMinor = 0;
    let returnsAllowancesMinor = 0;
    let totalCogsMinor = 0;
    let shippingMinor = 0;
    let processorFeesMinor = 0;
    let adSpendMinor = 0;
    let warehouseOpsMinor = 0;

    const txMap: Record<string, string[]> = {
      grossSales: [],
      returns: [],
      cogs: [],
      shipping: [],
      fees: [],
      ads: [],
      warehouse: [],
    };

    for (const tx of transactions) {
      // Validate entry balance
      const balance = this.validateDoubleEntry(tx);
      if (!balance.isValid) {
        throw new Error(
          `Unbalanced ledger entry "${tx.entryNumber}": Debits ($${(balance.totalDebitsMinor / 100).toFixed(2)}) != Credits ($${(balance.totalCreditsMinor / 100).toFixed(2)})`
        );
      }

      // Categorize entry
      const amount = balance.totalDebitsMinor;
      switch (tx.category) {
        case 'revenue':
          grossSalesMinor += amount;
          txMap.grossSales.push(tx.id);
          break;
        case 'refund':
          returnsAllowancesMinor += amount;
          txMap.returns.push(tx.id);
          break;
        case 'cogs':
          totalCogsMinor += amount;
          txMap.cogs.push(tx.id);
          break;
        case 'shipping':
          shippingMinor += amount;
          txMap.shipping.push(tx.id);
          break;
        case 'processor_fee':
          processorFeesMinor += amount;
          txMap.fees.push(tx.id);
          break;
        case 'ad_spend':
          adSpendMinor += amount;
          txMap.ads.push(tx.id);
          break;
        case 'supplier_payment':
          warehouseOpsMinor += amount;
          txMap.warehouse.push(tx.id);
          break;
      }
    }

    const netSalesMinor = grossSalesMinor - returnsAllowancesMinor;
    const grossProfitMinor = netSalesMinor - totalCogsMinor;
    const grossMarginBps = netSalesMinor > 0 ? Math.round((grossProfitMinor / netSalesMinor) * 10000) : 0;

    const totalOpExMinor = shippingMinor + processorFeesMinor + adSpendMinor + warehouseOpsMinor;
    const netOperatingIncomeMinor = grossProfitMinor - totalOpExMinor;
    const netMarginBps = netSalesMinor > 0 ? Math.round((netOperatingIncomeMinor / netSalesMinor) * 10000) : 0;

    const lineItems: PnLLineItem[] = [
      {
        key: 'gross_revenue',
        name: 'Gross Revenue',
        amountMinor: grossSalesMinor,
        currency,
        transactionIds: txMap.grossSales,
      },
      {
        key: 'returns_allowances',
        name: 'Returns & Allowances',
        amountMinor: -returnsAllowancesMinor,
        currency,
        transactionIds: txMap.returns,
      },
      {
        key: 'cogs',
        name: 'Cost of Goods Sold (COGS)',
        amountMinor: -totalCogsMinor,
        currency,
        transactionIds: txMap.cogs,
      },
      {
        key: 'shipping_fulfillment',
        name: 'Shipping & Fulfillment',
        amountMinor: -shippingMinor,
        currency,
        transactionIds: txMap.shipping,
      },
      {
        key: 'merchant_fees',
        name: 'Payment Processor Fees',
        amountMinor: -processorFeesMinor,
        currency,
        transactionIds: txMap.fees,
      },
      {
        key: 'ad_spend',
        name: 'Advertising & Marketing',
        amountMinor: -adSpendMinor,
        currency,
        transactionIds: txMap.ads,
      },
    ];

    return {
      period,
      currency,
      revenue: {
        grossSalesMinor,
        returnsAllowancesMinor,
        netSalesMinor,
      },
      cogs: {
        totalCogsMinor,
      },
      grossProfitMinor,
      grossMarginBps,
      operatingExpenses: {
        shippingFulfillmentMinor: shippingMinor,
        paymentProcessorFeesMinor: processorFeesMinor,
        advertisingSpendMinor: adSpendMinor,
        warehouseGeneralOpsMinor: warehouseOpsMinor,
        totalOpExMinor,
      },
      netOperatingIncomeMinor,
      netMarginBps,
      lineItems,
    };
  }

  /**
   * Reconcile Payment Processor Payout against Bank Settlement
   * Guarantees zero discrepancy down to the cent.
   */
  static reconcilePayout(input: PayoutReconciliationInput): {
    reconciled: boolean;
    expectedDepositMinor: number;
    discrepancyMinor: number;
    status: 'matched' | 'discrepancy_alert';
  } {
    const expectedDepositMinor =
      input.grossSalesMinor - input.refundsMinor - input.processorFeesMinor - input.adjustmentsMinor;

    const discrepancyMinor = input.bankDepositMinor - expectedDepositMinor;
    const reconciled = discrepancyMinor === 0;

    return {
      reconciled,
      expectedDepositMinor,
      discrepancyMinor,
      status: reconciled ? 'matched' : 'discrepancy_alert',
    };
  }
}
