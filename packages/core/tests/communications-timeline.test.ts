/**
 * Test Suite: Step 18 - Communications & Notification Engine
 * Exit Check: All sent communications appear on the order timeline; opt-outs sync across channels.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CommunicationService,
  type CustomerPreferences,
} from '../src/index.ts';
import {
  EmailMessagingAdapter,
  SmsMessagingAdapter,
} from '../../integrations/src/index.ts';

describe('Step 18: Communications & Notification Engine', () => {
  const commsService = new CommunicationService();
  const emailAdapter = new EmailMessagingAdapter();
  const smsAdapter = new SmsMessagingAdapter();

  describe('Exit Check: Order Timeline Logging for Communications', () => {
    it('automatically records all sent customer communications on the order timeline', () => {
      const orderId = 'ord-5501';
      const customerId = 'cust-901';

      // 1. Dispatch Order Confirmation
      const confirmLog = commsService.dispatchNotification({
        orderId,
        customerId,
        channel: 'email',
        category: 'transactional',
        template: 'order_confirmed',
        recipient: 'sarah.j@example.com',
        data: {
          orderNumber: 'ORD-5501',
          customerName: 'Sarah Jenkins',
          totalCents: 12500,
          shippingAddress: '123 Market St, San Francisco, CA',
        },
      });

      assert.strictEqual(confirmLog.status, 'sent');
      assert.ok(confirmLog.subject?.includes('ORD-5501'));

      // 2. Dispatch Shipment Notification with Live Tracking Link
      const shipLog = commsService.dispatchNotification({
        orderId,
        customerId,
        channel: 'email',
        category: 'transactional',
        template: 'order_shipped',
        recipient: 'sarah.j@example.com',
        data: {
          orderNumber: 'ORD-5501',
          customerName: 'Sarah Jenkins',
          carrier: 'UPS',
          trackingNumber: '1Z999AA10123456784',
        },
      });

      assert.strictEqual(shipLog.status, 'sent');
      assert.ok(shipLog.trackingUrl?.includes('track.storefrontops.com/UPS/1Z999AA10123456784'));

      // 3. Dispatch Day-of-Delivery SMS Alert
      const smsLog = commsService.dispatchNotification({
        orderId,
        customerId,
        channel: 'sms',
        category: 'transactional',
        template: 'out_for_delivery',
        recipient: '+14155552671',
        data: {
          orderNumber: 'ORD-5501',
          customerName: 'Sarah',
          carrier: 'UPS',
          trackingNumber: '1Z999AA10123456784',
        },
      });

      assert.strictEqual(smsLog.status, 'sent');

      // Step 18 Exit Check: Verify that all communications appear on the order timeline
      const timeline = commsService.getOrderTimeline(orderId);
      assert.strictEqual(timeline.length, 3);

      const titles = timeline.map((t) => t.title);
      assert.ok(titles.some((t) => t.includes('order confirmed via EMAIL')));
      assert.ok(titles.some((t) => t.includes('order shipped via EMAIL')));
      assert.ok(titles.some((t) => t.includes('out for delivery via SMS')));

      // Verify tracking link is persisted on the timeline item
      const shipmentTimeline = timeline.find((t) => t.title.includes('order shipped'));
      assert.ok(shipmentTimeline);
      assert.strictEqual(
        shipmentTimeline.metadata.trackingUrl,
        'https://track.storefrontops.com/UPS/1Z999AA10123456784'
      );
    });

    it('updates delivery receipt status directly on the order timeline entry', () => {
      const orderId = 'ord-7712';
      const log = commsService.dispatchNotification({
        orderId,
        customerId: 'cust-123',
        channel: 'email',
        category: 'transactional',
        template: 'order_delivered',
        recipient: 'buyer@example.com',
        data: {
          orderNumber: 'ORD-7712',
          deliveredAt: 'Front Porch at 2:15 PM',
        },
      });

      assert.strictEqual(log.status, 'sent');

      // Provider delivery receipt callback arrives
      const updated = commsService.handleDeliveryReceipt(log.messageId, 'delivered');
      assert.ok(updated);
      assert.strictEqual(updated.status, 'delivered');

      // Verify status reflected in timeline
      const timeline = commsService.getOrderTimeline(orderId);
      assert.strictEqual(timeline[0].metadata.status, 'delivered');
      assert.ok(timeline[0].description.includes('[Status: DELIVERED]'));
    });
  });

  describe('Exit Check: Cross-Channel Opt-Out Synchronization', () => {
    it('syncs marketing opt-out across email and SMS while preserving transactional notifications', () => {
      const customerId = 'cust-optout-user';
      const email = 'optout@example.com';
      const phone = '+15551234567';

      // 1. Initial State: Opted in
      let prefs = commsService.getPreferences(customerId, email, phone);
      assert.strictEqual(prefs.emailMarketingOptOut, false);
      assert.strictEqual(prefs.smsMarketingOptOut, false);

      // 2. Customer unsubscribes from marketing: Omnichannel sync updates both email & SMS
      prefs = commsService.syncMarketingOptOut(customerId, true);
      assert.strictEqual(prefs.emailMarketingOptOut, true);
      assert.strictEqual(prefs.smsMarketingOptOut, true);

      // 3. Attempt to dispatch marketing email -> Suppressed
      const emailMarketingLog = commsService.dispatchNotification({
        orderId: 'ord-mkt-1',
        customerId,
        channel: 'email',
        category: 'marketing',
        template: 'order_confirmed', // template used as payload
        recipient: email,
        data: { orderNumber: 'ORD-PROMO', customerName: 'Alex' },
      });
      assert.strictEqual(emailMarketingLog.status, 'suppressed_opt_out');

      // 4. Attempt to dispatch marketing SMS -> Suppressed by cross-channel sync
      const smsMarketingLog = commsService.dispatchNotification({
        orderId: 'ord-mkt-2',
        customerId,
        channel: 'sms',
        category: 'marketing',
        template: 'order_confirmed',
        recipient: phone,
        data: { orderNumber: 'ORD-PROMO', customerName: 'Alex' },
      });
      assert.strictEqual(smsMarketingLog.status, 'suppressed_opt_out');

      // 5. Critical Invariant: Transactional shipment tracking notifications MUST STILL deliver!
      const transactionalLog = commsService.dispatchNotification({
        orderId: 'ord-trans-3',
        customerId,
        channel: 'email',
        category: 'transactional',
        template: 'order_shipped',
        recipient: email,
        data: {
          orderNumber: 'ORD-TRANS-3',
          customerName: 'Alex',
          carrier: 'FedEx',
          trackingNumber: '794829103829',
        },
      });
      assert.strictEqual(transactionalLog.status, 'sent');
      assert.ok(transactionalLog.trackingUrl?.includes('FedEx'));
    });
  });

  describe('Decoupled Messaging Adapters (Email & SMS)', () => {
    it('dispatches emails via Resend adapter and SMS via Twilio adapter', async () => {
      const emailRes = await emailAdapter.sendEmail({
        to: 'customer@brand.com',
        subject: 'Your Order ORD-9912 is Confirmed',
        html: '<p>Thank you for ordering!</p>',
      });
      assert.strictEqual(emailRes.status, 'sent');
      assert.strictEqual(emailRes.provider, 'resend');
      assert.ok(emailRes.providerMessageId.startsWith('resend_'));

      const smsRes = await smsAdapter.sendSms({
        to: '+15559876543',
        body: 'ORD-9912 has shipped! Track here: https://track.storefrontops.com/UPS/1234',
      });
      assert.strictEqual(smsRes.status, 'sent');
      assert.strictEqual(smsRes.provider, 'twilio');
      assert.ok(smsRes.providerMessageId.startsWith('twilio_'));
    });
  });
});
