import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  WebhookPipeline,
  ShopifyAdapter,
  WooCommerceAdapter,
  StripeAdapter,
  type WebhookEventPayload,
} from '../src/index.ts';

describe('Step 14: Integrations Layer & Webhook Resiliency', () => {
  let pipeline: WebhookPipeline;

  beforeEach(() => {
    pipeline = new WebhookPipeline();
  });

  describe('HMAC Verification & Cryptographic Security', () => {
    test('validates authentic Shopify HMAC-SHA256 signature and rejects forged payload', () => {
      const secret = 'test_secret_key_12345';
      const rawBody = JSON.stringify({ id: 123456, total_price: '85.00' });

      // Generate authentic HMAC
      const validSignature = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');

      // Authentic check
      const isValid = WebhookPipeline.verifyHmacSignature(rawBody, validSignature, secret, 'base64');
      assert.equal(isValid, true);

      // Tampered check (altered amount in body)
      const tamperedBody = JSON.stringify({ id: 123456, total_price: '8.50' });
      const isTamperedValid = WebhookPipeline.verifyHmacSignature(tamperedBody, validSignature, secret, 'base64');
      assert.equal(isTamperedValid, false);
    });

    test('validates Stripe webhook timestamped signature', () => {
      const secret = 'whsec_stripe_test';
      const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signedPayload = `${timestamp}.${payload}`;
      const v1Signature = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

      const header = `t=${timestamp},v1=${v1Signature}`;

      const stripe = new StripeAdapter({ secretKey: 'sk_test', webhookSecret: secret });
      assert.equal(stripe.verifyWebhookSignature(payload, header), true);

      // Wrong signature
      const badHeader = `t=${timestamp},v1=wrong_hex_digest`;
      assert.equal(stripe.verifyWebhookSignature(payload, badHeader), false);
    });
  });

  describe('Payload Normalization (Integer Minor Units)', () => {
    test('Shopify adapter normalizes string decimal currency into integer cents', () => {
      const shopify = new ShopifyAdapter();
      const rawShopifyOrder = {
        id: 5491028491,
        name: '#10892',
        total_price: '142.50',
        currency: 'USD',
        created_at: '2026-11-01T12:00:00Z',
        email: 'alex.mercer@example.com',
        shipping_address: {
          first_name: 'Alex',
          last_name: 'Mercer',
          address1: '142 Grand St',
          city: 'Brooklyn',
          province: 'NY',
          zip: '11249',
          country_code: 'US',
        },
        line_items: [
          { id: 901, sku: 'HOODIE-BLK-M', name: 'Hoodie Black M', quantity: 1, price: '85.00' },
          { id: 902, sku: 'TEE-WHT-L', name: 'Tee White L', quantity: 2, price: '28.75' },
        ],
      };

      const normalized = shopify.normalizeOrder(rawShopifyOrder);

      // Exact integer cents
      assert.equal(normalized.totalAmountMinor, 14250);
      assert.equal(normalized.lines[0].unitPriceMinor, 8500);
      assert.equal(normalized.lines[1].unitPriceMinor, 2875);
      assert.equal(normalized.lines[1].totalPriceMinor, 5750);
      assert.equal(normalized.customerName, 'Alex Mercer');
      assert.equal(normalized.orderNumber, '#10892');
    });

    test('WooCommerce adapter normalizes REST payload into canonical order', () => {
      const woo = new WooCommerceAdapter();
      const rawWooOrder = {
        id: 7892,
        number: '7892',
        total: '79.99',
        currency: 'USD',
        date_created: '2026-11-01T10:00:00Z',
        billing: { email: 'elena@example.com', first_name: 'Elena', last_name: 'Rostova' },
        shipping: { address_1: '500 5th Ave', city: 'New York', state: 'NY', postcode: '10110' },
        line_items: [
          { id: 101, sku: 'CAP-NAVY-OS', name: 'Cap Navy', quantity: 1, price: '79.99' },
        ],
      };

      const normalized = woo.normalizeOrder(rawWooOrder);
      assert.equal(normalized.totalAmountMinor, 7999);
      assert.equal(normalized.orderNumber, 'WC-7892');
      assert.equal(normalized.customerEmail, 'elena@example.com');
    });
  });

  describe('Exit Check: Outage Simulation & Replay Test', () => {
    test('Exit Check: Network replay test produces zero duplicate orders', () => {
      const orderEvent: WebhookEventPayload = {
        integrationId: 'shopify_store_east',
        eventId: 'evt_order_created_99182',
        eventType: 'order.created',
        payload: {
          id: 99182,
          total_price: '120.00',
          line_items: [{ sku: 'HOODIE-BLK-M', price: '120.00', quantity: 1 }],
        },
        receivedAtIso: new Date().toISOString(),
      };

      let ordersCreatedCount = 0;
      const processor = (payload: any) => {
        ordersCreatedCount++;
        return {
          order: {
            externalId: String(payload.id),
            storeId: 'shopify_store_east',
            orderNumber: `ORD-${payload.id}`,
            placedAt: new Date().toISOString(),
            customerEmail: 'test@example.com',
            customerName: 'Test Customer',
            currency: 'USD',
            totalAmountMinor: 12000,
            status: 'pending' as const,
            lines: [],
            shippingAddress: { address1: '1 Main St', city: 'Anytown', postalCode: '19104', country: 'US' },
          },
        };
      };

      // 1. Initial Webhook Ingestion
      const res1 = pipeline.ingestWebhook(orderEvent, processor);
      assert.equal(res1.status, 'processed');
      assert.equal(ordersCreatedCount, 1);

      // 2. Replay the identical webhook 5 consecutive times (e.g. carrier / webhook retry storm)
      for (let i = 1; i <= 5; i++) {
        const replayRes = pipeline.ingestWebhook(orderEvent, processor);
        assert.equal(replayRes.status, 'skipped_duplicate');
      }

      // CRITICAL ASSERTION: Exactly 1 order created, ZERO duplicate orders created!
      assert.equal(ordersCreatedCount, 1);
    });

    test('Exit Check: Outage simulation buffers stock sync updates and flushes without missing updates', () => {
      // 1. Simulate network drop (outage occurs)
      pipeline.setNetworkOnline(false);
      assert.equal(pipeline.getIsNetworkOnline(), false);

      const stockEvent1: WebhookEventPayload = {
        integrationId: 'shopify_store_east',
        eventId: 'evt_stock_sync_1',
        eventType: 'inventory.level_set',
        payload: {
          updates: [
            { sku: 'HOODIE-BLK-M', availableStock: 45 },
            { sku: 'TEE-WHT-L', availableStock: 120 },
          ],
        },
        receivedAtIso: new Date().toISOString(),
      };

      const stockEvent2: WebhookEventPayload = {
        integrationId: 'shopify_store_east',
        eventId: 'evt_stock_sync_2',
        eventType: 'inventory.level_set',
        payload: {
          updates: [{ sku: 'CAP-NAVY-OS', availableStock: 15 }],
        },
        receivedAtIso: new Date().toISOString(),
      };

      // Both updates arrive during outage
      const res1 = pipeline.ingestWebhook(stockEvent1, () => ({}));
      const res2 = pipeline.ingestWebhook(stockEvent2, () => ({}));

      assert.equal(res1.status, 'buffered_offline');
      assert.equal(res2.status, 'buffered_offline');

      // 2. Simulate connectivity restored
      pipeline.setNetworkOnline(true);
      assert.equal(pipeline.getIsNetworkOnline(), true);

      // 3. Flush buffered updates
      const flushed = pipeline.flushOfflineBuffer();

      // CRITICAL ASSERTION: Zero missing stock sync updates
      assert.equal(flushed.length, 3);
      const skusFlushed = flushed.map((s) => s.sku);
      assert.ok(skusFlushed.includes('HOODIE-BLK-M'));
      assert.ok(skusFlushed.includes('TEE-WHT-L'));
      assert.ok(skusFlushed.includes('CAP-NAVY-OS'));
    });
  });
});
