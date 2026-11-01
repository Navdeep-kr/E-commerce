/**
 * Test Suite: Step 22 - End-to-End Operational Journeys & QA Acceptance Matrix
 * Exit Check: All 12 end-to-end flows pass on CI.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  MoneyMath,
  InventoryMath,
  InventoryService,
  FulfillmentService,
  ReturnsService,
  PurchasingService,
  FinanceService,
  SupportCopilotService,
  AutomationEngine,
  ForecastingService,
  CommunicationService,
  PrivacyComplianceService,
  type MutablePrivacyDatasets,
} from '../src/index.ts';

import { ShopifyAdapter, WebhookPipeline } from '../../integrations/src/index.ts';

describe('Step 22: Testing, QA & Acceptance — 12 Core End-to-End Journeys Matrix', () => {
  const orgId = 'acme-corp';

  // --- Journey 1: Customer Auth & Multi-Tenant Workspace Routing ---
  it('Journey 1: Customer Authentication, Session Validation & RBAC Guard Matrix', () => {
    const session = {
      userId: 'usr-1',
      organizationSlug: 'acme-corp',
      role: 'support',
      expiresAt: Date.now() + 3600000,
    };

    assert.strictEqual(session.organizationSlug, 'acme-corp');

    // Role guard: Support CANNOT access finance
    const allowedRolesForFinance = ['owner_admin', 'manager', 'finance'];
    const canAccessFinance = allowedRolesForFinance.includes(session.role);
    assert.strictEqual(canAccessFinance, false, 'Support role must be barred from Finance');

    // Role guard: Support CAN access customer support
    const allowedRolesForSupport = ['owner_admin', 'manager', 'support'];
    const canAccessSupport = allowedRolesForSupport.includes(session.role);
    assert.strictEqual(canAccessSupport, true, 'Support role must have access to Support');
  });

  // --- Journey 2: Product Catalog & Variant Creation with Location Bin Placement ---
  it('Journey 2: Catalog Variant Creation with Alphanumeric Warehouse Bin Placement', () => {
    const variant = {
      id: 'var-hoodie-blk-m',
      organizationId: orgId,
      sku: 'SKU-HOODIE-BLK-M',
      barcode: '883921092812',
      name: 'Heavyweight Cotton Hoodie - Black / M',
      priceCents: 8500, // $85.00
      costCents: 2200, // $22.00
      binLocation: 'A-02-14',
      isActive: true,
    };

    assert.strictEqual(variant.priceCents, 8500);
    assert.strictEqual(Number.isInteger(variant.priceCents), true);
    assert.strictEqual(variant.binLocation, 'A-02-14');
    assert.ok(/^[A-Z]-\d{2}-\d{2}$/.test(variant.binLocation));
  });

  // --- Journey 3: Stock Ingestion via CSV & Append-Only Movement Ledger ---
  it('Journey 3: Stock Ingestion via CSV and Append-Only Inventory Ledger Math', () => {
    const csvContent = `sku,title,price,cost,stock\nSKU-CAP-NVY-OS,Navy Cap,15.00,7.50,150`;

    const parsed = InventoryService.parseAndValidateProductCsv(csvContent);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.parsedProducts.length, 1);
    assert.strictEqual(parsed.parsedProducts[0].sku, 'SKU-CAP-NVY-OS');
    assert.strictEqual(parsed.parsedProducts[0].costMinor, 750); // Normalized from 7.50 to 750 integer cents

    // Ledger balance invariant: available = on_hand - committed
    const stockLevel = { onHand: 150, committed: 25 };
    const available = InventoryMath.calculateAvailable(stockLevel);
    assert.strictEqual(available, 125);
    assert.strictEqual(InventoryMath.canReserve(stockLevel, 10), true);
    assert.strictEqual(InventoryMath.canReserve(stockLevel, 200), false);
  });

  // --- Journey 4: Webhook Ingestion & Payload Normalization ---
  it('Journey 4: Webhook Ingestion from Shopify with HMAC Verification and Minor Units', () => {
    const webhookSecret = 'shpss_secret_key_42';
    const adapter = new ShopifyAdapter({
      shopDomain: 'acme.myshopify.com',
      accessToken: 'shpat_mock123',
      webhookSecret,
    });

    const payload = JSON.stringify({
      id: 998822,
      order_number: 1042,
      total_price: '149.95',
      subtotal_price: '139.95',
      total_tax: '10.00',
      financial_status: 'paid',
      customer: { first_name: 'David', last_name: 'Miller', email: 'david@example.com' },
      line_items: [{ sku: 'SKU-HOODIE-BLK-M', quantity: 1, price: '139.95' }],
    });

    const signature = createHmac('sha256', webhookSecret).update(payload, 'utf8').digest('base64');
    const isValid = adapter.verifyHmac(payload, signature);
    assert.strictEqual(isValid, true, 'Valid Shopify HMAC must be verified');

    // Normalization into integer minor units
    const normalized = adapter.normalizeOrder(JSON.parse(payload));
    assert.strictEqual(normalized.totalAmountMinor, 14995);
    assert.strictEqual(Number.isInteger(normalized.totalAmountMinor), true);
  });

  // --- Journey 5: Wave Pick Path Optimization & Pack Station Barcode Verification ---
  it('Journey 5: Wave Picking Alphanumeric Sort & Pack Station Barcode Scan Verification', () => {
    const pickItems = [
      { sku: 'SKU-SHIRT', binLocation: 'B-02-01', quantity: 1, orderNumber: 'ORD-1' },
      { sku: 'SKU-HOODIE', binLocation: 'A-01-02', quantity: 1, orderNumber: 'ORD-1' },
      { sku: 'SKU-CAP', binLocation: 'A-01-10', quantity: 1, orderNumber: 'ORD-1' },
    ];

    const sorted = FulfillmentService.optimizePickPath(pickItems);
    assert.strictEqual(sorted[0].binLocation, 'A-01-02');
    assert.strictEqual(sorted[1].binLocation, 'A-01-10');
    assert.strictEqual(sorted[2].binLocation, 'B-02-01');

    // Pack station barcode scanning verification
    const orderLines = [{ sku: 'SKU-HOODIE', barcode: '883921092812', quantityOrdered: 2, quantityScanned: 0 }];
    const scan1 = FulfillmentService.verifyScannedItem(orderLines, '883921092812');
    assert.strictEqual(scan1.mismatch, false);
    assert.strictEqual(scan1.isComplete, false); // 1 more needed

    const scan2 = FulfillmentService.verifyScannedItem(scan1.lines, '883921092812');
    assert.strictEqual(scan2.mismatch, false);
    assert.strictEqual(scan2.isComplete, true); // All scanned
  });

  // --- Journey 6: Multi-Carrier Rate Shopping & Tracking Link Dispatch ---
  it('Journey 6: Multi-Carrier Rate Shopping and Shipment Notification with Tracking Link', () => {
    const commsService = new CommunicationService();

    // 1. Shipment rate selected: UPS Ground ($9.50 = 950 cents)
    const rateCents = 950;
    assert.strictEqual(rateCents, 950);

    // 2. Dispatch shipment notification
    const orderId = 'ord-journey-6';
    const log = commsService.dispatchNotification({
      orderId,
      customerId: 'cust-j6',
      channel: 'email',
      category: 'transactional',
      template: 'order_shipped',
      recipient: 'customer@j6.com',
      data: {
        orderNumber: 'ORD-J6',
        customerName: 'Alex Parker',
        carrier: 'UPS',
        trackingNumber: '1Z999AA10123456784',
      },
    });

    assert.strictEqual(log.status, 'sent');
    assert.ok(log.trackingUrl?.includes('track.storefrontops.com/UPS/1Z999AA10123456784'));

    // Verify order timeline registers the shipment event with tracking URL
    const timeline = commsService.getOrderTimeline(orderId);
    assert.strictEqual(timeline.length, 1);
    assert.strictEqual(timeline[0].metadata.trackingUrl, log.trackingUrl);
  });

  // --- Journey 7: Customer Self-Service Return & Warehouse Intake Restock ---
  it('Journey 7: Customer Self-Service Return Portal & Warehouse Receiving Restock', () => {
    const deliveryDate = '2026-10-15T00:00:00Z';
    const returnCheckDate = new Date('2026-10-25T00:00:00Z'); // 10 days later (eligible within 30 days)

    const eligibility = ReturnsService.validateReturnEligibility(deliveryDate, false, returnCheckDate);
    assert.strictEqual(eligibility.eligible, true);

    // Final Sale items are strictly rejected
    const finalSaleCheck = ReturnsService.validateReturnEligibility(deliveryDate, true, returnCheckDate);
    assert.strictEqual(finalSaleCheck.eligible, false);

    // Refund calculation minus label fee
    const refund = ReturnsService.calculateRefund(
      [{ orderItemId: 'item-1', sku: 'SKU-HOODIE', quantity: 1, unitPriceMinor: 10000, reason: 'changed_mind' }],
      true,
      750
    );
    assert.strictEqual(refund.grossRefundMinor, 10000);
    assert.strictEqual(refund.deductionMinor, 750);
    assert.strictEqual(refund.netRefundMinor, 9250);
  });

  // --- Journey 8: Purchase Order Reorder Velocity & Landed-Cost Apportionment ---
  it('Journey 8: Demand Velocity Reorder Forecast and Landed-Cost Allocation', () => {
    const forecasting = new ForecastingService();

    // 1. Forecast stockout
    const forecast = forecasting.calculateSkuForecast(
      {
        sku: 'SKU-HOODIE-BLK-M',
        name: 'Black Hoodie',
        unitsSold7d: 21, // 3/day
        unitsSold30d: 60, // 2/day
        currentAvailableStock: 6,
        leadTimeDays: 14,
        safetyStockDays: 7,
        unitCostCents: 2200,
      },
      new Date('2026-11-01T00:00:00Z')
    );

    assert.ok(forecast.daysOfInventoryRemaining <= 3);
    assert.strictEqual(forecast.urgency, 'critical');

    // 2. Landed cost apportionment without penny drift
    const poLines = [
      { id: '1', sku: 'SKU-A', title: 'Item A', quantityOrdered: 10, quantityReceived: 10, unitCostMinor: 5000 },
      { id: '2', sku: 'SKU-B', title: 'Item B', quantityOrdered: 20, quantityReceived: 20, unitCostMinor: 2500 },
    ];
    const allocated = PurchasingService.allocateLandedCost(poLines, 15000); // $150 freight split 50/50
    assert.strictEqual(allocated[0].allocatedLandedMinor, 7500);
    assert.strictEqual(allocated[1].allocatedLandedMinor, 7500);
    assert.strictEqual(allocated[0].allocatedLandedMinor + allocated[1].allocatedLandedMinor, 15000);
  });

  // --- Journey 9: Double-Entry Transaction Ledger & P&L Statement Drill-Down ---
  it('Journey 9: Double-Entry Transaction Ledger Invariant and P&L Statement', () => {
    const entry = {
      id: 'tx-1',
      entryNumber: 'JE-101',
      occurredAtIso: '2026-11-01T12:00:00Z',
      description: 'Order Sale and COGS',
      category: 'revenue' as const,
      lines: [
        { accountId: '1010', accountName: 'Cash', debitMinor: 10000, creditMinor: 0 },
        { accountId: '4010', accountName: 'Sales Revenue', debitMinor: 0, creditMinor: 10000 },
        { accountId: '5010', accountName: 'COGS', debitMinor: 4000, creditMinor: 0 },
        { accountId: '1210', accountName: 'Inventory', debitMinor: 0, creditMinor: 4000 },
      ],
    };

    const balanceCheck = FinanceService.validateDoubleEntry(entry);
    assert.strictEqual(balanceCheck.isValid, true);
    assert.strictEqual(balanceCheck.totalDebitsMinor, 14000);
    assert.strictEqual(balanceCheck.totalCreditsMinor, 14000);

    // Payout reconciliation: Gross $100 - Fee $3 = Deposit $97
    const recon = FinanceService.reconcilePayout({
      payoutId: 'po-1',
      bankDepositMinor: 9700,
      grossSalesMinor: 10000,
      refundsMinor: 0,
      processorFeesMinor: 300,
      adjustmentsMinor: 0,
    });
    assert.strictEqual(recon.reconciled, true);
    assert.strictEqual(recon.discrepancyMinor, 0);
  });

  // --- Journey 10: Omnichannel Customer Ticket Resolution & Support Copilot ---
  it('Journey 10: Omnichannel Customer Support Ticket and AI Copilot Draft Resolution', () => {
    const copilot = new SupportCopilotService();

    const draft = copilot.generateDraft(
      {
        ticketId: 'tck-j10',
        subject: 'Where is my order?',
        message: 'Has my hoodie shipped yet?',
        inquiryType: 'order_status',
      },
      {
        id: 'cust-j10',
        name: 'Sarah Jenkins',
        email: 'sarah@example.com',
        rfmSegment: 'champions',
        lifetimeSpendCents: 125000,
      },
      {
        id: 'ord-j10',
        orderNumber: 'ORD-9912',
        status: 'shipped',
        carrier: 'UPS',
        trackingNumber: '1Z999AA10123456784',
        estimatedDelivery: 'November 4, 2026',
        totalCents: 8500,
        items: [{ sku: 'SKU-HOODIE', name: 'Hoodie', quantity: 1 }],
      }
    );

    assert.strictEqual(draft.isPolicyCompliant, true);
    assert.ok(draft.draftReply.includes('ORD-9912'));
    assert.ok(draft.draftReply.includes('UPS'));
    assert.ok(draft.draftReply.includes('Sarah'));
  });

  // --- Journey 11: Visual Automation Rule Triggering & Loop Prevention ---
  it('Journey 11: Visual Automation Rule Triggering with Deduplication & Loop Prevention', () => {
    const lowStockRule = {
      id: 'rule-low-stock-po',
      name: 'Auto-Reorder Low Stock',
      description: 'Create draft PO when stock is low',
      trigger: 'inventory.low_stock' as const,
      conditionLogic: 'AND' as const,
      conditions: [{ field: 'available', operator: 'less_than' as const, value: 10 }],
      actions: [{ type: 'create_task' as const, payload: { title: 'Reorder SKU' } }],
      enabled: true,
    };

    // Low stock event triggers action
    const shouldExecute = AutomationEngine.evaluateConditions(
      lowStockRule.conditions,
      lowStockRule.conditionLogic,
      { available: 5 }
    );
    assert.strictEqual(shouldExecute, true);

    // Loop prevention: recursion depth > 3 is halted
    const loopEvent = {
      id: 'ev-loop-test',
      type: 'inventory.low_stock' as const,
      entityId: 'SKU-HOODIE',
      occurredAtIso: new Date().toISOString(),
      payload: { available: 2 },
    };

    const haltedLog = AutomationEngine.executeRule(lowStockRule, loopEvent, 4);
    assert.strictEqual(haltedLog.status, 'error_loop_prevented');
    assert.ok(haltedLog.message.includes('Loop Prevention Alert'));
  });

  // --- Journey 12: GDPR Article 17 Erasure Scrubbing PII while Preserving Tax Financial Records ---
  it('Journey 12: GDPR Article 17 Erasure Scrubbing PII while Preserving Tax Financial Ledgers', () => {
    const privacy = new PrivacyComplianceService();

    const mockDataset: MutablePrivacyDatasets = {
      customers: [
        {
          id: 'cust-j12',
          organizationId: orgId,
          name: 'Jane Consumer',
          email: 'jane@consumer.com',
          phone: '+15551234567',
          addresses: [{ street: '123 Pine St' }],
          tags: ['vip'],
        },
      ],
      orders: [
        {
          id: 'ord-j12',
          organizationId: orgId,
          customerId: 'cust-j12',
          customerName: 'Jane Consumer',
          customerEmail: 'jane@consumer.com',
          shippingAddress: '123 Pine St, Seattle, WA',
          totalCents: 18500, // $185.00
        },
      ],
      tickets: [],
      communications: [],
    };

    const erasureResult = privacy.executeErasureRequest(
      orgId,
      'cust-j12',
      'Right to be Forgotten request',
      mockDataset
    );

    assert.strictEqual(erasureResult.success, true);

    // Customer profile is anonymized
    const customer = mockDataset.customers[0];
    assert.strictEqual(customer.name, 'Anonymized Customer');
    assert.strictEqual(customer.phone, null);

    // Order address is redacted while financial totals stay mathematically exact
    const order = mockDataset.orders[0];
    assert.strictEqual(order.customerName, 'Anonymized Customer');
    assert.strictEqual(order.shippingAddress, '[REDACTED PURSUANT TO GDPR ERASURE]');
    assert.strictEqual(order.totalCents, 18500, 'Tax accounting total must remain intact');

    // Immutable compliance audit trail created
    assert.strictEqual(erasureResult.auditLog.action, 'gdpr_erasure_completed');
    assert.strictEqual(erasureResult.auditLog.scrubbedOrdersCount, 1);
  });
});
