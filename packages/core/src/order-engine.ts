/**
 * Storefront Ops Core: Order Calculations, Pricing & Risk Scoring Engine
 * Playbook Step 8: Deterministic minor-unit calculations, discount stacking, tax rounding, and fraud risk scoring
 */

import { MoneyMath, type Money } from './money.ts';
import { OrderStateMachine, type OrderStatus } from './order-machine.ts';

export interface CartLineInput {
  sku: string;
  variantTitle?: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface OrderTotalsResult {
  lines: Array<{
    sku: string;
    variantTitle?: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }>;
  subtotalMinor: number;
  discountMinor: number;
  taxableSubtotalMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
}

export interface RiskInput {
  orderTotalMinor: number;
  billingAddress: {
    address1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    address1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  customerPreviousOrdersCount: number;
  failedPaymentAttemptsCount: number;
  email: string;
}

export interface RiskEvaluationResult {
  score: number; // 0 to 100
  riskLevel: 'low' | 'medium' | 'high';
  flags: string[];
  recommendation: 'accept' | 'review' | 'auto_hold';
}

export class OrderEngine {
  /**
   * Calculate exact order financial breakdown in integer minor units
   * Guarantees: subtotal = sum(lines), taxable = max(0, subtotal - discount), total = taxable + shipping + tax
   */
  static calculateTotals(
    lines: CartLineInput[],
    discountMinor: number = 0,
    shippingMinor: number = 0,
    taxBasisPoints: number = 0,
    currency: string = 'USD'
  ): OrderTotalsResult {
    if (lines.length === 0) {
      return {
        lines: [],
        subtotalMinor: 0,
        discountMinor: 0,
        taxableSubtotalMinor: 0,
        shippingMinor: 0,
        taxMinor: 0,
        totalMinor: 0,
        currency,
      };
    }

    let subtotalMinor = 0;
    const computedLines = lines.map((line) => {
      if (line.quantity <= 0) {
        throw new RangeError(`Line item ${line.sku} quantity must be greater than zero`);
      }
      if (line.unitPriceMinor < 0) {
        throw new RangeError(`Line item ${line.sku} unit price cannot be negative`);
      }

      const lineTotalMinor = line.quantity * line.unitPriceMinor;
      subtotalMinor += lineTotalMinor;

      return {
        sku: line.sku,
        variantTitle: line.variantTitle,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
        lineTotalMinor,
      };
    });

    const safeDiscount = Math.min(subtotalMinor, Math.max(0, discountMinor));
    const taxableSubtotalMinor = subtotalMinor - safeDiscount;

    // Deterministic tax basis points calculation (e.g. 8.25% = 825 bp)
    const taxMinor = Math.round((taxableSubtotalMinor * taxBasisPoints) / 10000);
    const safeShipping = Math.max(0, shippingMinor);
    const totalMinor = taxableSubtotalMinor + safeShipping + taxMinor;

    return {
      lines: computedLines,
      subtotalMinor,
      discountMinor: safeDiscount,
      taxableSubtotalMinor,
      shippingMinor: safeShipping,
      taxMinor,
      totalMinor,
      currency,
    };
  }

  /**
   * Automated fraud risk assessment rules engine
   */
  static evaluateRisk(input: RiskInput): RiskEvaluationResult {
    let score = 0;
    const flags: string[] = [];

    // Rule 1: High value order (> $500.00 / 50000 minor units)
    if (input.orderTotalMinor >= 50000) {
      score += 25;
      flags.push('HIGH_ORDER_VALUE: Total exceeds $500 threshold');
    }

    // Rule 2: Billing & Shipping Country or Postal Code mismatch
    const countryMismatch =
      input.billingAddress.country.toUpperCase() !== input.shippingAddress.country.toUpperCase();
    const postalMismatch =
      input.billingAddress.postalCode.trim().toLowerCase() !==
      input.shippingAddress.postalCode.trim().toLowerCase();

    if (countryMismatch) {
      score += 45;
      flags.push('CRITICAL_MISMATCH: Billing and shipping countries differ');
    } else if (postalMismatch) {
      score += 20;
      flags.push('ADDRESS_MISMATCH: Postal codes differ between billing and shipping');
    }

    // Rule 3: Repeated failed payment attempts
    if (input.failedPaymentAttemptsCount > 0) {
      const penalty = Math.min(50, input.failedPaymentAttemptsCount * 25);
      score += penalty;
      flags.push(`FAILED_PAYMENTS: ${input.failedPaymentAttemptsCount} prior failed attempts`);
    }

    // Rule 4: Suspicious disposable email domain
    const disposableDomains = ['tempmail.com', 'throwaway.email', 'mailinator.com', '10minutemail.com'];
    const emailDomain = input.email.split('@')[1]?.toLowerCase() || '';
    if (disposableDomains.includes(emailDomain)) {
      score += 35;
      flags.push('DISPOSABLE_EMAIL: Customer registered with temporary email domain');
    }

    // First time customer bonus risk if high value
    if (input.customerPreviousOrdersCount === 0 && input.orderTotalMinor >= 30000) {
      score += 15;
      flags.push('NEW_CUSTOMER_HIGH_TICKET: First order exceeds $300');
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let recommendation: 'accept' | 'review' | 'auto_hold' = 'accept';

    if (score >= 60) {
      riskLevel = 'high';
      recommendation = 'auto_hold';
    } else if (score >= 30) {
      riskLevel = 'medium';
      recommendation = 'review';
    }

    return {
      score,
      riskLevel,
      flags,
      recommendation,
    };
  }
}

/**
 * In-memory Idempotency Guard to prevent double submissions from retried webhooks or double clicks
 */
export class IdempotencyGuard {
  private static readonly STORE = new Map<string, { orderId: string; createdAt: number }>();
  private static readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  static checkAndReserve(key: string, orderId: string): { isDuplicate: boolean; existingOrderId?: string } {
    const existing = this.STORE.get(key);
    if (existing) {
      return { isDuplicate: true, existingOrderId: existing.orderId };
    }
    this.STORE.set(key, { orderId, createdAt: Date.now() });
    return { isDuplicate: false };
  }

  static clear(): void {
    this.STORE.clear();
  }
}
