import { NextResponse } from 'next/server';
import { ShopifyAdapter, WebhookPipeline } from '@storefront-ops/integrations';

const pipeline = new WebhookPipeline();
const shopify = new ShopifyAdapter();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const topicHeader = request.headers.get('x-shopify-topic') || 'orders/create';
    const eventIdHeader = request.headers.get('x-shopify-webhook-id') || `shp_${Date.now()}`;

    // Verify cryptographic signature if header provided
    if (hmacHeader) {
      const isValid = shopify.verifyHmac(rawBody, hmacHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    const result = pipeline.ingestWebhook(
      {
        integrationId: 'shopify_store_east',
        eventId: eventIdHeader,
        eventType: 'order.created',
        payload,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => {
        const order = shopify.normalizeOrder(p);
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
    console.error('Shopify webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
