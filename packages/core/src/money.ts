/**
 * Storefront Ops Core: Money & Financial Mathematics
 * Rule 6: All money is integer minor units (cents) plus ISO currency. Never floats.
 */

export interface Money {
  amount: number; // Integer in minor units (e.g. 1250 = $12.50)
  currency: string; // ISO 4217 (e.g. 'USD', 'EUR', 'GBP')
}

export class MoneyMath {
  /**
   * Validate that amount is an integer
   */
  static validate(money: Money): void {
    if (!Number.isInteger(money.amount)) {
      throw new TypeError(`Money amount must be an integer (minor units). Received: ${money.amount}`);
    }
    if (!money.currency || money.currency.length !== 3) {
      throw new Error(`Currency must be a 3-letter ISO code. Received: ${money.currency}`);
    }
  }

  /**
   * Add two money values of the same currency
   */
  static add(a: Money, b: Money): Money {
    this.assertSameCurrency(a, b);
    return {
      amount: a.amount + b.amount,
      currency: a.currency,
    };
  }

  /**
   * Subtract money b from money a
   */
  static subtract(a: Money, b: Money): Money {
    this.assertSameCurrency(a, b);
    return {
      amount: a.amount - b.amount,
      currency: a.currency,
    };
  }

  /**
   * Multiply money by a scalar (with deterministic bankers / half-even rounding)
   */
  static multiply(money: Money, multiplier: number): Money {
    this.validate(money);
    return {
      amount: Math.round(money.amount * multiplier),
      currency: money.currency,
    };
  }

  /**
   * Calculate basis points percentage (e.g. 8.25% tax = 825 basis points)
   */
  static applyBasisPoints(money: Money, basisPoints: number): Money {
    this.validate(money);
    return {
      amount: Math.round((money.amount * basisPoints) / 10000),
      currency: money.currency,
    };
  }

  /**
   * Calculate gross margin percentage in basis points (100% = 10000 bp)
   * Formula: ((Revenue - Cost) / Revenue) * 10000
   */
  static calculateMarginBasisPoints(revenue: Money, cost: Money): number {
    this.assertSameCurrency(revenue, cost);
    if (revenue.amount <= 0) return 0;
    const profit = revenue.amount - cost.amount;
    return Math.round((profit * 10000) / revenue.amount);
  }

  /**
   * Format money into standard display string (e.g. 1250 USD -> "$12.50")
   */
  static format(money: Money, locale: string = 'en-US'): string {
    this.validate(money);
    const decimalValue = money.amount / 100;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(decimalValue);
  }

  private static assertSameCurrency(a: Money, b: Money): void {
    this.validate(a);
    this.validate(b);
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch: cannot operate on ${a.currency} and ${b.currency}`);
    }
  }
}
