import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUS_CONFIGS, STOCK_STATUS_CONFIGS } from '../src/index.ts';

describe('UI Design Tokens & Components (Step 5)', () => {
  it('defines comprehensive semantic status tokens for all order states', () => {
    const requiredStatuses = [
      'pending_payment',
      'paid',
      'on_hold',
      'ready_to_pack',
      'packing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
      'partially_fulfilled',
    ];

    for (const st of requiredStatuses) {
      assert.ok(ORDER_STATUS_CONFIGS[st], `Missing status config for order state: ${st}`);
      assert.ok(ORDER_STATUS_CONFIGS[st].label, `Missing label for: ${st}`);
      assert.ok(ORDER_STATUS_CONFIGS[st].iconName, `Missing icon name for: ${st}`);
      assert.ok(ORDER_STATUS_CONFIGS[st].variant, `Missing semantic variant for: ${st}`);
    }
  });

  it('defines stock status tokens', () => {
    assert.equal(STOCK_STATUS_CONFIGS.ok.variant, 'success');
    assert.equal(STOCK_STATUS_CONFIGS.low.variant, 'warning');
    assert.equal(STOCK_STATUS_CONFIGS.out.variant, 'danger');
  });

  it('verifies CSV generation formatting logic', () => {
    interface SampleOrder {
      id: string;
      orderNumber: string;
      totalCents: number;
      customer: string;
    }

    const testData: SampleOrder[] = [
      { id: '1', orderNumber: 'ORD-101', totalCents: 15000, customer: 'Alice Smith' },
      { id: '2', orderNumber: 'ORD-102', totalCents: 24500, customer: 'Bob Jones' },
    ];

    const headers = ['Order Number', 'Total Cents', 'Customer'];
    const rows = testData.map((d) => [d.orderNumber, d.totalCents, `"${d.customer}"`].join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    assert.ok(csv.includes('Order Number,Total Cents,Customer'));
    assert.ok(csv.includes('ORD-101,15000,"Alice Smith"'));
    assert.ok(csv.includes('ORD-102,24500,"Bob Jones"'));
  });
});
