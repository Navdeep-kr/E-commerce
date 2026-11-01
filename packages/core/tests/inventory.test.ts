import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryMath, type StockLevel } from '../src/inventory.ts';

describe('InventoryMath (Rule 7: Invariants and Stock Math)', () => {
  it('calculates available stock strictly as on_hand minus committed', () => {
    const stock: StockLevel = {
      variantId: 'var-123',
      locationId: 'loc-main',
      onHand: 100,
      committed: 35,
      incoming: 50,
    };
    const available = InventoryMath.calculateAvailable(stock);
    assert.equal(available, 65);
  });

  it('clamps available stock to 0 when committed equals or exceeds onHand', () => {
    const stock = { onHand: 20, committed: 25 };
    assert.equal(InventoryMath.calculateAvailable(stock), 0);
  });

  it('correctly verifies if stock can be reserved', () => {
    const stock = { onHand: 50, committed: 40 }; // 10 available
    assert.equal(InventoryMath.canReserve(stock, 10), true);
    assert.equal(InventoryMath.canReserve(stock, 11), false);
  });

  it('calculates reorder point based on lead time and safety stock', () => {
    const rop = InventoryMath.calculateReorderPoint({
      averageDailySales: 5,
      leadTimeDays: 14, // 70 units demand
      safetyStockDays: 7, // 35 units safety
    });
    assert.equal(rop, 105);
  });

  it('calculates days of stock left', () => {
    assert.equal(InventoryMath.calculateDaysOfStockLeft(100, 10), 10);
    assert.equal(InventoryMath.calculateDaysOfStockLeft(0, 10), 0);
    assert.equal(InventoryMath.calculateDaysOfStockLeft(50, 0), 999);
  });
});
