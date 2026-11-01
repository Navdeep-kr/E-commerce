import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderEngine, IdempotencyGuard, type CartLineInput } from '../src/order-engine.ts';

describe('OrderEngine Core Calculations & Fraud Scoring (Step 8)', () => {
  it('Property Test: 1,000 randomly generated carts match independent reference calculation to the cent', () => {
    // Deterministic pseudo-random seed
    let seed = 12345;
    function rand(min: number, max: number): number {
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      return Math.floor(rnd * (max - min + 1)) + min;
    }

    for (let c = 1; c <= 1000; c++) {
      const lineCount = rand(1, 10);
      const lines: CartLineInput[] = [];
      let expectedSubtotal = 0;

      for (let l = 1; l <= lineCount; l++) {
        const qty = rand(1, 8);
        const unitPrice = rand(500, 25000); // $5.00 to $250.00
        const lineTotal = qty * unitPrice;
        expectedSubtotal += lineTotal;

        lines.push({
          sku: `SKU-${c}-${l}`,
          quantity: qty,
          unitPriceMinor: unitPrice,
        });
      }

      const discount = rand(0, Math.floor(expectedSubtotal / 2));
      const shipping = rand(0, 3000); // $0 to $30.00
      const taxBp = rand(0, 1200); // 0% to 12.00% tax

      const result = OrderEngine.calculateTotals(lines, discount, shipping, taxBp);

      // Independent assertion check
      assert.equal(result.subtotalMinor, expectedSubtotal);
      const expectedTaxable = expectedSubtotal - discount;
      assert.equal(result.taxableSubtotalMinor, expectedTaxable);
      const expectedTax = Math.round((expectedTaxable * taxBp) / 10000);
      assert.equal(result.taxMinor, expectedTax);
      const expectedTotal = expectedTaxable + shipping + expectedTax;
      assert.equal(result.totalMinor, expectedTotal, `Cart #${c} total mismatch`);
    }
  });

  it('guarantees idempotency: cannot place the same order twice with duplicate key', () => {
    IdempotencyGuard.clear();
    const idempotencyKey = 'req_idempotent_order_001';

    // First attempt succeeds
    const firstAttempt = IdempotencyGuard.checkAndReserve(idempotencyKey, 'ord_1001');
    assert.equal(firstAttempt.isDuplicate, false);

    // Immediate second attempt (double click or webhook replay) is intercepted
    const secondAttempt = IdempotencyGuard.checkAndReserve(idempotencyKey, 'ord_1001');
    assert.equal(secondAttempt.isDuplicate, true);
    assert.equal(secondAttempt.existingOrderId, 'ord_1001');
  });

  it('correctly assesses fraud risk score and triggers auto_hold for critical mismatch', () => {
    const highRiskInput = {
      orderTotalMinor: 85000, // $850.00
      billingAddress: {
        address1: '123 Fake St',
        city: 'New York',
        postalCode: '10001',
        country: 'US',
      },
      shippingAddress: {
        address1: '456 Foreign Ave',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB', // Country mismatch
      },
      customerPreviousOrdersCount: 0,
      failedPaymentAttemptsCount: 2, // 2 prior failed attempts
      email: 'fraudster@throwaway.email', // disposable domain
    };

    const risk = OrderEngine.evaluateRisk(highRiskInput);

    assert.equal(risk.riskLevel, 'high');
    assert.equal(risk.recommendation, 'auto_hold');
    assert.ok(risk.score >= 60, `Risk score should exceed 60, was ${risk.score}`);
    assert.ok(risk.flags.some((f) => f.includes('CRITICAL_MISMATCH')));
    assert.ok(risk.flags.some((f) => f.includes('DISPOSABLE_EMAIL')));
  });

  it('marks low risk for domestic verified recurring customer', () => {
    const lowRiskInput = {
      orderTotalMinor: 4500, // $45.00
      billingAddress: { address1: '10 Main St', city: 'Boston', postalCode: '02108', country: 'US' },
      shippingAddress: { address1: '10 Main St', city: 'Boston', postalCode: '02108', country: 'US' },
      customerPreviousOrdersCount: 8,
      failedPaymentAttemptsCount: 0,
      email: 'jane.smith@gmail.com',
    };

    const risk = OrderEngine.evaluateRisk(lowRiskInput);
    assert.equal(risk.riskLevel, 'low');
    assert.equal(risk.recommendation, 'accept');
    assert.equal(risk.flags.length, 0);
  });
});
