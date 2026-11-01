import { NextResponse } from 'next/server';
import { WooCommerceAdapter, WebhookPipeline } from '@storefront-ops/integrations';

const pipeline = new WebhookPipeline();
const woo = new WooCommerceAdapter();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('x-wc-webhook-signature') || '';
    const topicHeader = request.headers.get('x-wc-webhook-topic') || 'order.created';
    const eventIdHeader = request.headers.get('x-wc-webhook-id') || `woo_${Date.now()}`;

    if (sigHeader) {
      const isValid = woo.verifySignature(rawBody, sigHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid WooCommerce signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    const result = pipeline.ingestWebhook(
      {
        integrationId: 'woocommerce_site_main',
        eventId: eventIdHeader,
        eventType: 'order.created',
        payload,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => {
        const order = woo.normalizeOrder(p);
        return { order };
      }
    );

    return NextResponse.json({
      success: true,
      topic: topicHeader,
      ingestionStatus: result.status,
      message: result.message,
    });
  } catch (error: any) {
    console.error('WooCommerce webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
