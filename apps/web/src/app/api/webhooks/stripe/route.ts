import { NextResponse } from 'next/server';
import { StripeAdapter, WebhookPipeline } from '@storefront-ops/integrations';

const pipeline = new WebhookPipeline();
const stripe = new StripeAdapter();

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

    const result = pipeline.ingestWebhook(
      {
        integrationId: 'stripe_gateway',
        eventId: event.id || `evt_${Date.now()}`,
        eventType: event.type?.includes('refund') ? 'payment.refunded' : 'payment.succeeded',
        payload: event.data?.object || event,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => ({})
    );

    return NextResponse.json({
      success: true,
      eventId: event.id,
      ingestionStatus: result.status,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
