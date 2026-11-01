import { NextResponse } from 'next/server';
import { StripeAdapter, WebhookPipeline } from '@storefront-ops/integrations';
import { db } from '@storefront-ops/db';
import { BillingService } from '@storefront-ops/core';

const pipeline = new WebhookPipeline();
const stripe = new StripeAdapter();
const billingService = new BillingService();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('stripe-signature') || '';

    if (sigHeader) {
      const isValid = stripe.verifyWebhookSignature(rawBody, sigHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || 'payment.succeeded';
    const obj = event.data?.object || event;

    let updatedOrgId: string | null = null;

    // Handle Stripe Subscription Lifecycle Events
    if (eventType === 'checkout.session.completed') {
      const orgId = obj.client_reference_id || 'org-acme-prod';
      db.updateSubscription(orgId, {
        status: 'active',
        stripeCustomerId: obj.customer || `cus_${orgId.slice(0, 8)}`,
        stripeSubscriptionId: obj.subscription || `sub_${Date.now()}`,
        isReadOnly: false,
      });
      updatedOrgId = orgId;
    } else if (eventType === 'customer.subscription.updated') {
      const orgId = obj.client_reference_id || 'org-acme-prod';
      const stripeStatus = obj.status; // 'active', 'past_due', 'canceled', etc.
      if (['active', 'past_due', 'canceled', 'unpaid', 'trialing'].includes(stripeStatus)) {
        db.updateSubscription(orgId, {
          status: stripeStatus,
          isReadOnly: ['canceled', 'unpaid'].includes(stripeStatus),
        });
      }
      updatedOrgId = orgId;
    } else if (eventType === 'customer.subscription.deleted') {
      const orgId = obj.client_reference_id || 'org-acme-prod';
      db.updateSubscription(orgId, {
        status: 'canceled',
        isReadOnly: true,
      });
      updatedOrgId = orgId;
    } else if (eventType === 'invoice.payment_failed') {
      const orgId = obj.client_reference_id || 'org-acme-prod';
      const sub = db.getSubscription(orgId);
      const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.updateSubscription(orgId, {
        status: 'past_due',
        gracePeriodEnd: graceEnd,
        isReadOnly: false,
      });
      updatedOrgId = orgId;
    }

    const result = pipeline.ingestWebhook(
      {
        integrationId: 'stripe_gateway',
        eventId: event.id || `evt_${Date.now()}`,
        eventType: eventType.includes('refund') ? 'payment.refunded' : 'payment.succeeded',
        payload: obj,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => ({})
    );

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventType,
      ingestionStatus: result.status,
      message: result.message,
      updatedOrgId,
    });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
