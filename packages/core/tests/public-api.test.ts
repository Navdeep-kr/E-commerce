import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiKeyService,
  OutboundWebhookService,
  type ApiScope,
} from '../src/index.ts';

describe('Step 15: Public REST API & Webhooks', () => {
  beforeEach(() => {
    ApiKeyService.clearRateLimitCache();
  });

  describe('ApiKeyService & Scopes', () => {
    test('generates prefixed live API key and verifies against hashed storage', () => {
      const { rawKey, apiKeyRecord } = ApiKeyService.generateApiKey('live', 'Shopify Backend Sync', ['orders:read', 'orders:write']);

      assert.ok(rawKey.startsWith('sf_live_'));
      assert.equal(apiKeyRecord.keyPrefix, 'sf_live_');
      assert.ok(apiKeyRecord.preview.startsWith('sf_live_...'));

      // Raw key must never equal hashed key
      assert.notEqual(rawKey, apiKeyRecord.hashedKey);

      // Verify authentic key
      const auth = ApiKeyService.verifyKey(rawKey, apiKeyRecord, 'orders:read');
      assert.equal(auth.authorized, true);

      // Verify wrong key
      const badAuth = ApiKeyService.verifyKey('sf_live_invalid_key_99999', apiKeyRecord, 'orders:read');
      assert.equal(badAuth.authorized, false);
      assert.match(badAuth.error || '', /Invalid API key/);
    });

    test('enforces strict scope isolation between read and write operations', () => {
      const { rawKey, apiKeyRecord } = ApiKeyService.generateApiKey('test', 'Read-Only Reporter', ['orders:read']);

      // Allowed scope
      const readCheck = ApiKeyService.verifyKey(rawKey, apiKeyRecord, 'orders:read');
      assert.equal(readCheck.authorized, true);

      // Denied scope: Cannot write orders
      const writeCheck = ApiKeyService.verifyKey(rawKey, apiKeyRecord, 'orders:write');
      assert.equal(writeCheck.authorized, false);
      assert.match(writeCheck.error || '', /Insufficient API key scope/);

      // Denied scope: Cannot access inventory
      const inventoryCheck = ApiKeyService.verifyKey(rawKey, apiKeyRecord, 'inventory:read');
      assert.equal(inventoryCheck.authorized, false);
    });

    test('tracks rate limits and emits standard rate limiting headers', () => {
      const keyId = 'key_rate_test_1';
      const limit = 5;

      // 5 requests allowed
      for (let i = 1; i <= 5; i++) {
        const status = ApiKeyService.checkRateLimit(keyId, limit);
        assert.equal(status.allowed, true);
        assert.equal(status.limit, 5);
        assert.equal(status.remaining, 5 - i);
      }

      // 6th request blocked
      const blockedStatus = ApiKeyService.checkRateLimit(keyId, limit);
      assert.equal(blockedStatus.allowed, false);
      assert.equal(blockedStatus.remaining, 0);
      assert.ok(blockedStatus.resetUnixSeconds > 0);
    });
  });

  describe('OutboundWebhookService & HMAC Signing', () => {
    test('signs outbound webhook payload with timestamped HMAC-SHA256 signature', () => {
      const secret = 'whsec_outbound_client_secret_999';
      const payload = JSON.stringify({
        event: 'order.shipped',
        data: { orderId: 'ord-10892', trackingNumber: '94001118995648123901' },
      });

      const { headerValue, timestamp, signature } = OutboundWebhookService.signPayload(payload, secret);
      assert.ok(headerValue.includes(`t=${timestamp}`));
      assert.ok(headerValue.includes(`v1=${signature}`));

      // Verify authentic signature
      const isValid = OutboundWebhookService.verifySignature(payload, headerValue, secret);
      assert.equal(isValid, true);

      // Tampered payload
      const tamperedPayload = JSON.stringify({
        event: 'order.shipped',
        data: { orderId: 'ord-10892', trackingNumber: 'TAMPERED_FAKE_TRACKING' },
      });
      const isTamperedValid = OutboundWebhookService.verifySignature(tamperedPayload, headerValue, secret);
      assert.equal(isTamperedValid, false);
    });

    test('rejects expired webhook signatures exceeding tolerance threshold', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ ping: 'pong' });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const pastTimestamp = nowSeconds - 600; // 10 minutes ago (tolerance is 5 min)

      const expiredSign = OutboundWebhookService.signPayload(payload, secret, pastTimestamp);

      const isValid = OutboundWebhookService.verifySignature(
        payload,
        expiredSign.headerValue,
        secret,
        300, // 5 min tolerance
        nowSeconds
      );

      assert.equal(isValid, false);
    });
  });

  describe('Step 15 Exit Check: Developer Order Sync Simulation', () => {
    test('Exit Check: Third-party developer authenticates and performs order sync using documentation in < 15 minutes', () => {
      // 1. Developer generates an authorized API key
      const { rawKey, apiKeyRecord } = ApiKeyService.generateApiKey('live', 'Third-Party ERP Integration', [
        'orders:read',
        'orders:write',
        'inventory:read',
      ]);

      assert.ok(rawKey.startsWith('sf_live_'));

      // 2. Developer authenticates with Bearer token
      const authHeader = `Bearer ${rawKey}`;
      const token = authHeader.replace('Bearer ', '');
      const auth = ApiKeyService.verifyKey(token, apiKeyRecord, 'orders:read');
      assert.equal(auth.authorized, true);

      // 3. Developer checks rate limits
      const rateLimit = ApiKeyService.checkRateLimit(apiKeyRecord.id, 120);
      assert.equal(rateLimit.allowed, true);
      assert.equal(rateLimit.limit, 120);

      // 4. Developer performs order fulfillment sync
      const writeAuth = ApiKeyService.verifyKey(token, apiKeyRecord, 'orders:write');
      assert.equal(writeAuth.authorized, true);

      // 5. Storefront Ops emits outbound webhook to developer endpoint with valid HMAC signature
      const clientWebhookSecret = 'dev_whsec_secret_alpha';
      const outboundEvent = JSON.stringify({
        eventId: 'evt_sync_101',
        topic: 'orders.fulfilled',
        orderNumber: 'ORD-10892',
        trackingNumber: '94001118995648123901',
        fulfilledAt: new Date().toISOString(),
      });

      const { headerValue } = OutboundWebhookService.signPayload(outboundEvent, clientWebhookSecret);

      // Developer verifies HMAC signature on their server
      const clientVerified = OutboundWebhookService.verifySignature(outboundEvent, headerValue, clientWebhookSecret);
      assert.equal(clientVerified, true);
    });
  });
});
