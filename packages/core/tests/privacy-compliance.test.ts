/**
 * Test Suite: Step 21 - Legal, Compliance, GDPR/CCPA Privacy & Accessibility
 * Exit Check: Automated privacy deletion request executes cleanly across all tables with audit trails.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PrivacyComplianceService,
  type MutablePrivacyDatasets,
} from '../src/index.ts';

describe('Step 21: Legal, Compliance & Privacy Engine', () => {
  const privacyService = new PrivacyComplianceService();

  const createMockDataset = (): MutablePrivacyDatasets => ({
    customers: [
      {
        id: 'cust-42',
        organizationId: 'acme-corp',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+15551234567',
        addresses: [{ street: '123 Elm St', city: 'Metropolis', zip: '90210' }],
        tags: ['vip', 'newsletter'],
      },
      {
        id: 'cust-99',
        organizationId: 'other-corp',
        name: 'Bob Smith',
        email: 'bob@other.com',
        phone: '+15559876543',
        addresses: [{ street: '456 Oak St' }],
      },
    ],
    orders: [
      {
        id: 'ord-101',
        organizationId: 'acme-corp',
        customerId: 'cust-42',
        customerName: 'Jane Doe',
        customerEmail: 'jane.doe@example.com',
        shippingAddress: '123 Elm St, Metropolis, 90210',
        totalCents: 14500, // $145.00
        financialStatus: 'paid',
      },
      {
        id: 'ord-102',
        organizationId: 'acme-corp',
        customerId: 'cust-42',
        customerName: 'Jane Doe',
        customerEmail: 'jane.doe@example.com',
        shippingAddress: '123 Elm St, Metropolis, 90210',
        totalCents: 8200, // $82.00
        financialStatus: 'paid',
      },
    ],
    tickets: [
      {
        id: 'tck-1',
        organizationId: 'acme-corp',
        customerId: 'cust-42',
        requesterName: 'Jane Doe',
        messages: [
          { sender: 'customer', body: 'My phone number is +15551234567, please call me.' },
        ],
      },
    ],
    communications: [
      {
        messageId: 'msg-1',
        customerId: 'cust-42',
        recipient: 'jane.doe@example.com',
        body: 'Your order ORD-101 has shipped to 123 Elm St.',
      },
    ],
  });

  describe('Exit Check: Automated GDPR Article 17 Erasure ("Right to be Forgotten")', () => {
    it('executes privacy deletion cleanly across all tables and generates immutable audit trail', () => {
      const dataset = createMockDataset();
      const orgId = 'acme-corp';
      const customerId = 'cust-42';
      const reason = 'Customer submitted GDPR Article 17 right-to-erasure request';

      const result = privacyService.executeErasureRequest(
        orgId,
        customerId,
        reason,
        dataset,
        new Date('2026-11-01T14:00:00Z')
      );

      // 1. Erasure execution summary
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.erasureSummary.customerAnonymized, true);
      assert.strictEqual(result.erasureSummary.ordersScrubbed, 2);
      assert.strictEqual(result.erasureSummary.ticketsScrubbed, 1);
      assert.strictEqual(result.erasureSummary.communicationsScrubbed, 1);

      // 2. Customer profile scrubbed of PII
      const customer = dataset.customers.find((c) => c.id === customerId);
      assert.ok(customer);
      assert.strictEqual(customer.name, 'Anonymized Customer');
      assert.strictEqual(customer.email, 'anonymized_cust-42@deleted.storefrontops.com');
      assert.strictEqual(customer.phone, null);
      assert.strictEqual(customer.addresses?.length, 0);
      assert.deepStrictEqual(customer.tags, ['gdpr_erased']);

      // 3. Orders scrubbed while preserving exact integer minor-unit financial amounts
      const orders = dataset.orders.filter((o) => o.customerId === customerId);
      assert.strictEqual(orders.length, 2);
      for (const order of orders) {
        assert.strictEqual(order.customerName, 'Anonymized Customer');
        assert.strictEqual(order.customerEmail, null);
        assert.strictEqual(order.shippingAddress, '[REDACTED PURSUANT TO GDPR ERASURE]');
        // Crucial invariant: financial totals remain mathematically exact for tax records!
        assert.ok(order.totalCents > 0);
      }
      assert.strictEqual(orders[0].totalCents, 14500);
      assert.strictEqual(orders[1].totalCents, 8200);

      // 4. Support tickets messages scrubbed
      const tickets = dataset.tickets.filter((t) => t.customerId === customerId);
      assert.strictEqual(tickets[0].requesterName, 'Anonymized Customer');
      assert.strictEqual(tickets[0].messages[0].body, '[MESSAGE REDACTED PURSUANT TO GDPR ERASURE]');

      // 5. Communications logs scrubbed
      const comms = dataset.communications.filter((c) => c.customerId === customerId);
      assert.strictEqual(comms[0].recipient, 'redacted@privacy.local');
      assert.strictEqual(comms[0].body, '[COMMUNICATION LOG PURGED PURSUANT TO GDPR ERASURE]');

      // 6. Step 21 Exit Check: Immutable audit log entry created
      assert.strictEqual(result.auditLog.action, 'gdpr_erasure_completed');
      assert.strictEqual(result.auditLog.customerId, 'cust-42');
      assert.strictEqual(result.auditLog.scrubbedOrdersCount, 2);
      assert.strictEqual(result.auditLog.scrubbedTicketsCount, 1);
      assert.strictEqual(result.auditLog.scrubbedCommunicationsCount, 1);
      assert.strictEqual(result.auditLog.reason, reason);
      assert.strictEqual(result.auditLog.executedAt, '2026-11-01T14:00:00.000Z');

      const storedAudits = privacyService.getAuditRecords(orgId);
      assert.strictEqual(storedAudits.length, 1);
      assert.strictEqual(storedAudits[0].id, result.auditLog.id);
    });

    it('enforces tenant boundary during erasure and does not affect other organizations', () => {
      const dataset = createMockDataset();

      // Attempt erasure with wrong organizationId
      const result = privacyService.executeErasureRequest(
        'wrong-org',
        'cust-42',
        'Unauthorized erasure attempt',
        dataset
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.erasureSummary.ordersScrubbed, 0);

      // Verify Acme Corp customer remains intact
      const customer = dataset.customers.find((c) => c.id === 'cust-42');
      assert.strictEqual(customer?.name, 'Jane Doe');
    });
  });

  describe('Data Subject Access Request (DSAR) Portable Export', () => {
    it('compiles complete customer data export package with integrity checksum', () => {
      const dataset = createMockDataset();
      const exportPkg = privacyService.generateCustomerDataExport(
        'acme-corp',
        'cust-42',
        dataset,
        new Date('2026-11-01T12:00:00Z')
      );

      assert.ok(exportPkg);
      assert.strictEqual(exportPkg.customerId, 'cust-42');
      assert.strictEqual(exportPkg.organizationId, 'acme-corp');
      assert.strictEqual(exportPkg.orders.length, 2);
      assert.strictEqual(exportPkg.tickets.length, 1);
      assert.strictEqual(exportPkg.communications.length, 1);
      assert.ok(exportPkg.checksum.length > 0);
    });
  });
});
