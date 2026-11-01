import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MoneyMath, type Money } from '../src/money.ts';

describe('MoneyMath (Rule 6: Minor integer unit money)', () => {
  it('adds money of identical currency correctly', () => {
    const a: Money = { amount: 1550, currency: 'USD' }; // $15.50
    const b: Money = { amount: 2450, currency: 'USD' }; // $24.50
    const sum = MoneyMath.add(a, b);
    assert.equal(sum.amount, 4000); // $40.00
    assert.equal(sum.currency, 'USD');
  });

  it('rejects addition with mismatched currencies', () => {
    const usd: Money = { amount: 1000, currency: 'USD' };
    const eur: Money = { amount: 1000, currency: 'EUR' };
    assert.throws(() => MoneyMath.add(usd, eur), /Currency mismatch/);
  });

  it('rejects floating-point non-integer amounts', () => {
    const invalid: Money = { amount: 15.55, currency: 'USD' };
    assert.throws(() => MoneyMath.validate(invalid), /must be an integer/);
  });

  it('calculates tax basis points deterministically', () => {
    const subtotal: Money = { amount: 10000, currency: 'USD' }; // $100.00
    const tax = MoneyMath.applyBasisPoints(subtotal, 825); // 8.25%
    assert.equal(tax.amount, 825); // $8.25
  });

  it('computes gross margin in basis points', () => {
    const revenue: Money = { amount: 10000, currency: 'USD' }; // $100.00
    const cost: Money = { amount: 4000, currency: 'USD' }; // $40.00
    const margin = MoneyMath.calculateMarginBasisPoints(revenue, cost);
    assert.equal(margin, 6000); // 60.00%
  });

  it('formats display string properly', () => {
    const m: Money = { amount: 12500, currency: 'USD' }; // $125.00
    const str = MoneyMath.format(m);
    assert.ok(str.includes('125.00') || str.includes('125'));
  });
});
