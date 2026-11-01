import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ReturnsService,
  CustomerService,
  SupportService,
  type ReturnItemInput,
  type CustomerProfile,
} from '../src/index.ts';

describe('Step 10: Returns, Customers & Support Modules', () => {
  describe('ReturnsService & Policy Engine', () => {
    test('validates return eligibility within 30-day window', () => {
      const now = new Date('2026-11-01T12:00:00Z');
      const delivery10DaysAgo = new Date('2026-10-22T12:00:00Z').toISOString();
      const check = ReturnsService.validateReturnEligibility(delivery10DaysAgo, false, now, 30);

      assert.equal(check.eligible, true);
      assert.equal(check.daysSinceDelivery, 10);
    });

    test('rejects return if past the 30-day window', () => {
      const now = new Date('2026-11-01T12:00:00Z');
      const delivery45DaysAgo = new Date('2026-09-17T12:00:00Z').toISOString();
      const check = ReturnsService.validateReturnEligibility(delivery45DaysAgo, false, now, 30);

      assert.equal(check.eligible, false);
      assert.match(check.reason || '', /Return window expired/);
      assert.equal(check.daysSinceDelivery, 45);
    });

    test('strictly rejects returns for Final Sale items regardless of date', () => {
      const now = new Date('2026-11-01T12:00:00Z');
      const deliveredYesterday = new Date('2026-10-31T12:00:00Z').toISOString();
      const check = ReturnsService.validateReturnEligibility(deliveredYesterday, true, now, 30);

      assert.equal(check.eligible, false);
      assert.match(check.reason || '', /Final Sale/);
    });

    test('calculates refund with optional shipping label fee deduction', () => {
      const items: ReturnItemInput[] = [
        {
          orderItemId: 'item-1',
          sku: 'HOODIE-BLK-M',
          quantity: 1,
          unitPriceMinor: 8500, // $85.00
          reason: 'wrong_size',
        },
        {
          orderItemId: 'item-2',
          sku: 'TEE-WHT-L',
          quantity: 2,
          unitPriceMinor: 2800, // $28.00 * 2 = $56.00
          reason: 'changed_mind',
        },
      ];

      // Gross: 8500 + 5600 = 14100 ($141.00)
      const fullRefund = ReturnsService.calculateRefund(items, false);
      assert.equal(fullRefund.grossRefundMinor, 14100);
      assert.equal(fullRefund.deductionMinor, 0);
      assert.equal(fullRefund.netRefundMinor, 14100);

      // With $5.95 return shipping deduction
      const deductedRefund = ReturnsService.calculateRefund(items, true, 595);
      assert.equal(deductedRefund.grossRefundMinor, 14100);
      assert.equal(deductedRefund.deductionMinor, 595);
      assert.equal(deductedRefund.netRefundMinor, 13505); // $135.05
    });

    test('Exit Check: Return intake in warehouse automatically increments inventory and processes customer refund', () => {
      const returnItem: ReturnItemInput = {
        orderItemId: 'item-101',
        sku: 'JACKET-DWN-L',
        quantity: 1,
        unitPriceMinor: 19500, // $195.00
        reason: 'wrong_size',
      };

      // Case 1: Item in brand new condition -> Graded as 'restock'
      const restockResult = ReturnsService.processWarehouseIntake(
        'ret-9001',
        'ord-5002',
        returnItem,
        'restock',
        'R-02-B'
      );

      assert.equal(restockResult.shouldRestock, true);
      assert.notEqual(restockResult.inventoryAdjustment, null);
      assert.equal(restockResult.inventoryAdjustment?.sku, 'JACKET-DWN-L');
      assert.equal(restockResult.inventoryAdjustment?.quantity, 1);
      assert.equal(restockResult.inventoryAdjustment?.reasonCode, 'return');
      assert.equal(restockResult.inventoryAdjustment?.binLocation, 'R-02-B');
      assert.equal(restockResult.refundSummary.netRefundMinor, 19500);

      // Case 2: Damaged / unsellable -> Graded as 'dispose'
      const disposeResult = ReturnsService.processWarehouseIntake(
        'ret-9002',
        'ord-5003',
        returnItem,
        'dispose'
      );

      assert.equal(disposeResult.shouldRestock, false);
      assert.equal(disposeResult.inventoryAdjustment, null);
      assert.equal(disposeResult.refundSummary.netRefundMinor, 19500);
    });
  });

  describe('CustomerService & CRM Analytics', () => {
    test('calculates RFM scores and categorizes Champions vs At Risk customers', () => {
      const now = new Date('2026-11-01T12:00:00Z');

      // Champion: ordered 5 days ago, 12 orders, $1,500 total spend
      const champion = CustomerService.calculateRfm(
        '2026-10-27T10:00:00Z',
        12,
        150000,
        now
      );
      assert.equal(champion.recencyScore, 5);
      assert.equal(champion.frequencyScore, 5);
      assert.equal(champion.monetaryScore, 5);
      assert.equal(champion.segment, 'Champions');

      // At Risk: ordered 120 days ago, 4 orders, $300 spend
      const atRisk = CustomerService.calculateRfm(
        '2026-07-04T10:00:00Z',
        4,
        30000,
        now
      );
      assert.equal(atRisk.recencyScore, 2);
      assert.equal(atRisk.frequencyScore, 3);
      assert.equal(atRisk.segment, 'At Risk');

      // First-Time buyer: 1 order 10 days ago
      const firstTime = CustomerService.calculateRfm(
        '2026-10-22T10:00:00Z',
        1,
        4500,
        now
      );
      assert.equal(firstTime.segment, 'First-Time');
    });

    test('merges two customer profiles combining orders, spend, tags, and addresses without loss', () => {
      const primary: CustomerProfile = {
        id: 'cust-1',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Mercer',
        createdAt: '2025-01-01T00:00:00Z',
        lastOrderDateIso: '2026-10-01T00:00:00Z',
        ordersCount: 4,
        totalSpentMinor: 45000,
        tags: ['vip', 'newsletter'],
        addresses: [
          { street1: '142 Grand St', city: 'Brooklyn', state: 'NY', zip: '11249', country: 'US', isDefault: true },
        ],
      };

      const secondary: CustomerProfile = {
        id: 'cust-2',
        email: 'alex.work@example.com',
        phone: '+15550199',
        firstName: 'Alexander',
        lastName: 'Mercer',
        createdAt: '2025-06-01T00:00:00Z',
        lastOrderDateIso: '2026-10-25T00:00:00Z', // More recent order
        ordersCount: 2,
        totalSpentMinor: 22000,
        tags: ['retail-pop-up'],
        addresses: [
          { street1: '500 5th Ave', city: 'New York', state: 'NY', zip: '10110', country: 'US' },
          { street1: '142 Grand St', city: 'Brooklyn', state: 'NY', zip: '11249', country: 'US' }, // duplicate address
        ],
      };

      const result = CustomerService.mergeProfiles(primary, secondary);

      // Primary customer retains combined spend and counts
      assert.equal(result.updatedPrimary.ordersCount, 6);
      assert.equal(result.updatedPrimary.totalSpentMinor, 67000);
      assert.equal(result.updatedPrimary.lastOrderDateIso, '2026-10-25T00:00:00Z');
      assert.ok(result.updatedPrimary.tags.includes('vip'));
      assert.ok(result.updatedPrimary.tags.includes('retail-pop-up'));
      assert.ok(result.updatedPrimary.tags.includes('merged'));
      assert.equal(result.updatedPrimary.addresses.length, 2); // Deduped from 3 down to 2

      // Secondary customer marked as merged
      assert.equal(result.archivedSecondary.mergedIntoId, 'cust-1');
      assert.ok(result.archivedSecondary.tags.includes('archived-merged'));
    });
  });

  describe('SupportService & Omnichannel Inbox', () => {
    test('calculates first response SLA deadline based on urgency', () => {
      const created = '2026-11-01T10:00:00.000Z';

      const urgentDeadline = SupportService.calculateFirstResponseDeadline(created, 'urgent');
      assert.equal(urgentDeadline, '2026-11-01T11:00:00.000Z'); // 1 hour

      const highDeadline = SupportService.calculateFirstResponseDeadline(created, 'high');
      assert.equal(highDeadline, '2026-11-01T14:00:00.000Z'); // 4 hours
    });

    test('interpolates canned macros into customer response template', () => {
      const template =
        'Hi {{customer_name}}, your order {{order_number}} has been refunded in the amount of {{refund_amount}}.';
      const variables = {
        customer_name: 'Brianna',
        order_number: 'ORD-10893',
        refund_amount: '$38.00',
      };

      const interpolated = SupportService.interpolateMacro(template, variables);
      assert.equal(
        interpolated,
        'Hi Brianna, your order ORD-10893 has been refunded in the amount of $38.00.'
      );
    });
  });
});
