import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryService } from '../src/inventory-service.ts';

describe('InventoryService Core Domain Logic (Step 7)', () => {
  it('calculates bundle availability as the minimum capacity among components', () => {
    // E.g. Bundle requires 2 Batteries and 1 Camera
    // Component A: 20 Batteries available / 2 required = capacity for 10 bundles
    // Component B: 4 Cameras available / 1 required = capacity for 4 bundles
    const components = [
      { sku: 'BAT-100', availableStock: 20, quantityRequiredPerBundle: 2 },
      { sku: 'CAM-500', availableStock: 4, quantityRequiredPerBundle: 1 },
    ];

    const bundleAvailable = InventoryService.calculateBundleAvailability(components);
    assert.equal(bundleAvailable, 4, 'Bundle availability must be constrained by the 4 cameras');
  });

  it('calculates inventory valuation in minor units', () => {
    const items = [
      { variantId: 'v1', sku: 'SKU-A', onHand: 10, unitCostMinor: 1500, currency: 'USD' }, // 10 * $15 = $150 (15000)
      { variantId: 'v2', sku: 'SKU-B', onHand: 5, unitCostMinor: 4000, currency: 'USD' },  // 5 * $40 = $200 (20000)
    ];

    const valuation = InventoryService.calculateValuation(items);
    assert.equal(valuation.amount, 35000); // $350.00
    assert.equal(valuation.currency, 'USD');
  });

  it('validates CSV imports and catches duplicate SKUs with row numbers', () => {
    const csv = `sku,title,price,cost,stock\nSHIRT-BLK-S,Black Shirt Small,29.99,10.00,50\nSHIRT-BLK-S,Duplicate Shirt,29.99,10.00,20`;
    const result = InventoryService.parseAndValidateProductCsv(csv);

    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].row, 3);
    assert.ok(result.errors[0].message.includes('Duplicate SKU detected'));
  });

  it('parses valid CSV rows into integer minor units', () => {
    const csv = `sku,title,price,cost,stock\nCAP-NAVY,Navy Baseball Cap,19.50,6.25,120`;
    const result = InventoryService.parseAndValidateProductCsv(csv);

    assert.equal(result.valid, true);
    assert.equal(result.parsedProducts.length, 1);
    const prod = result.parsedProducts[0];
    assert.equal(prod.sku, 'CAP-NAVY');
    assert.equal(prod.priceMinor, 1950); // $19.50 -> 1950 cents
    assert.equal(prod.costMinor, 625);   // $6.25 -> 625 cents
    assert.equal(prod.stock, 120);
  });

  it('benchmarks parsing 10,000 product rows in < 500ms without timeouts', () => {
    const header = 'sku,title,price,cost,stock,vendor\n';
    const rows: string[] = [];
    for (let i = 1; i <= 10000; i++) {
      rows.push(`SKU-BULK-${i},Product Model ${i},${(i % 100) + 0.99},${(i % 50) + 0.5},${i % 500},AcmeVendor`);
    }
    const largeCsv = header + rows.join('\n');

    const start = Date.now();
    const result = InventoryService.parseAndValidateProductCsv(largeCsv);
    const elapsed = Date.now() - start;

    assert.equal(result.valid, true);
    assert.equal(result.validRowsCount, 10000);
    assert.ok(elapsed < 500, `Expected 10,000 row parse in < 500ms, took ${elapsed}ms`);
  });
});
