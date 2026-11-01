import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSeedData } from '../src/seed-generator.ts';

describe('Deterministic Seed Generator (Step 6)', () => {
  it('runs deterministically producing identical outputs for the same seed', () => {
    const run1 = generateSeedData(1.0);
    const run2 = generateSeedData(1.0);

    assert.equal(run1.productsCount, run2.productsCount);
    assert.equal(run1.variantsCount, run2.variantsCount);
    assert.equal(run1.ordersCount, run2.ordersCount);
    assert.deepEqual(run1.sampleProducts, run2.sampleProducts);
    assert.deepEqual(run1.sampleOrders, run2.sampleOrders);
  });

  it('guarantees inventory invariant: available = on_hand - committed', () => {
    const data = generateSeedData(0.1); // smaller scale for fast check
    for (const prod of data.sampleProducts) {
      assert.equal(
        prod.available,
        prod.onHand - prod.committed,
        `Inventory invariant failed for product ${prod.sku}: onHand (${prod.onHand}) - committed (${prod.committed}) !== available (${prod.available})`
      );
    }
  });

  it('guarantees integer minor-unit money values (zero floats)', () => {
    const data = generateSeedData(0.1);
    for (const prod of data.sampleProducts) {
      assert.ok(Number.isInteger(prod.priceMinor), `Price must be integer cents: ${prod.priceMinor}`);
      assert.ok(Number.isInteger(prod.costMinor), `Cost must be integer cents: ${prod.costMinor}`);
    }
    for (const ord of data.sampleOrders) {
      assert.ok(Number.isInteger(ord.totalMinor), `Order total must be integer cents: ${ord.totalMinor}`);
    }
  });

  it('verifies all expected edge cases are populated', () => {
    const data = generateSeedData(1.0);

    assert.ok(data.edgeCases.backordersCount > 0, 'Backorders must be present');
    assert.ok(data.edgeCases.partialShipmentsCount > 0, 'Partial shipments must be present');
    assert.ok(data.edgeCases.fraudHoldsCount > 0, 'Fraud holds must be present');
    assert.ok(data.edgeCases.chargebacksCount > 0, 'Payment chargebacks must be present');
    assert.ok(data.edgeCases.negativeMarginProductsCount > 0, 'Negative margin products must be present');
    assert.ok(data.edgeCases.returnsCount > 0, 'Returns must be present');
  });

  it('verifies execution speed benchmark completes in < 2,000ms', () => {
    const start = Date.now();
    const data = generateSeedData(1.0);
    const elapsed = Date.now() - start;

    assert.equal(data.ordersCount, 25000);
    assert.ok(elapsed < 2000, `Seed took ${elapsed}ms, expected < 2000ms`);
  });
});
