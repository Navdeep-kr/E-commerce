import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FulfillmentService, type PickItem, type PackVerificationLine } from '../src/fulfillment-service.ts';

describe('FulfillmentService & Pack Station Engine (Step 9)', () => {
  it('optimizes pick path by alphanumeric bin sequence to eliminate warehouse backtracking', () => {
    const unoptimized: PickItem[] = [
      { sku: 'TEE-WHT-L', binLocation: 'B-04-12', quantity: 2, orderNumber: 'ORD-101' },
      { sku: 'HOODIE-BLK-M', binLocation: 'A-01-05', quantity: 1, orderNumber: 'ORD-102' },
      { sku: 'CAP-NAVY-OS', binLocation: 'A-01-02', quantity: 1, orderNumber: 'ORD-103' },
      { sku: 'SOCKS-GRY', binLocation: 'C-02-01', quantity: 3, orderNumber: 'ORD-104' },
    ];

    const optimized = FulfillmentService.optimizePickPath(unoptimized);
    const bins = optimized.map((it) => it.binLocation);

    assert.deepEqual(bins, ['A-01-02', 'A-01-05', 'B-04-12', 'C-02-01']);
  });

  it('calculates SLA deadline countdown urgency levels correctly', () => {
    // Current time: 1:30 PM (13:30)
    const mockNow = new Date('2026-11-01T13:30:00.000Z');

    // 1. Order placed this morning, cutoff at 16:00 (2.5h remaining -> warning)
    const warningOrder = FulfillmentService.calculateSlaStatus(
      '2026-11-01T09:00:00.000Z',
      mockNow,
      16
    );
    assert.equal(warningOrder.status, 'warning');
    assert.equal(warningOrder.hoursRemaining, 2.5);

    // 2. Order placed yesterday, cutoff past (breached)
    const breachedOrder = FulfillmentService.calculateSlaStatus(
      '2026-10-31T09:00:00.000Z',
      mockNow,
      12 // 12:00 cutoff was 1.5h ago
    );
    assert.equal(breachedOrder.status, 'breached');
  });

  it('handles item scan verification, catches mismatches, and detects completion', () => {
    const orderLines: PackVerificationLine[] = [
      { sku: 'HOODIE-BLK-M', barcode: '84920199201', quantityOrdered: 2, quantityScanned: 0 },
      { sku: 'CAP-NAVY-OS', barcode: '84920199202', quantityOrdered: 1, quantityScanned: 0 },
    ];

    // Scan 1: First hoodie
    const scan1 = FulfillmentService.verifyScannedItem(orderLines, '84920199201');
    assert.equal(scan1.mismatch, false);
    assert.equal(scan1.matchedSku, 'HOODIE-BLK-M');
    assert.equal(scan1.isComplete, false);
    assert.equal(scan1.remainingTotal, 2);

    // Scan 2: Unrelated wrong item
    const scan2 = FulfillmentService.verifyScannedItem(scan1.lines, 'WRONG-BARCODE-999');
    assert.equal(scan2.mismatch, true);
    assert.ok(scan2.message.includes('MISMATCH ALERT'));

    // Scan 3: Second hoodie
    const scan3 = FulfillmentService.verifyScannedItem(scan1.lines, 'HOODIE-BLK-M');
    assert.equal(scan3.remainingTotal, 1);

    // Scan 4: Attempting third hoodie (over-pick)
    const scan4 = FulfillmentService.verifyScannedItem(scan3.lines, 'HOODIE-BLK-M');
    assert.equal(scan4.mismatch, true);
    assert.ok(scan4.message.includes('OVER-PICK WARNING'));

    // Scan 5: The Cap (final item)
    const scan5 = FulfillmentService.verifyScannedItem(scan3.lines, 'CAP-NAVY-OS');
    assert.equal(scan5.mismatch, false);
    assert.equal(scan5.isComplete, true);
    assert.equal(scan5.remainingTotal, 0);
  });

  it('releases backorders in strict FIFO order (oldest orders first)', () => {
    const backorders = [
      { orderId: 'ord-3', orderNumber: 'ORD-003', sku: 'SKU-X', quantityWaiting: 5, placedAt: '2026-10-25T10:00:00Z' },
      { orderId: 'ord-1', orderNumber: 'ORD-001', sku: 'SKU-X', quantityWaiting: 10, placedAt: '2026-10-20T10:00:00Z' }, // Oldest
      { orderId: 'ord-2', orderNumber: 'ORD-002', sku: 'SKU-X', quantityWaiting: 5, placedAt: '2026-10-22T10:00:00Z' }, // Second oldest
    ];

    // Received 15 units of SKU-X on incoming PO
    const incoming = { 'SKU-X': 15 };

    const result = FulfillmentService.releaseBackorders(incoming, backorders);

    // Should release ord-1 (10 units) and ord-2 (5 units) in FIFO sequence
    assert.deepEqual(result.releasedOrderIds, ['ord-1', 'ord-2']);
    assert.equal(result.remainingIncoming['SKU-X'], 0);
  });
});
