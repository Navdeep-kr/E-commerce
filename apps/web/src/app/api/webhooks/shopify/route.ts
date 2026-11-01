import { NextResponse } from 'next/server';
import { ShopifyAdapter, WebhookPipeline } from '@storefront-ops/integrations';
import { db } from '@storefront-ops/db';

const pipeline = new WebhookPipeline();
const shopify = new ShopifyAdapter();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const topicHeader = request.headers.get('x-shopify-topic') || 'orders/create';
    const shopDomain = request.headers.get('x-shopify-shop-domain') || '';
    const eventIdHeader = request.headers.get('x-shopify-webhook-id') || `shp_${Date.now()}`;

    // Verify cryptographic signature if header provided
    if (hmacHeader) {
      const isValid = shopify.verifyHmac(rawBody, hmacHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    let createdOrder: any = null;

    const result = pipeline.ingestWebhook(
      {
        integrationId: shopDomain || 'shopify_store_east',
        eventId: eventIdHeader,
        eventType: topicHeader.includes('order') ? 'order.created' : 'inventory.level_set',
        payload,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => {
        const order = shopify.normalizeOrder(p);

        // Multi-tenant persistence: find org by domain or fall back to default
        const targetOrg = db.getOrganizationByStoreDomain(shopDomain) || db.getOrganizationBySlug('acme-commerce');
        if (targetOrg) {
          createdOrder = db.createOrder(targetOrg.id, {
            order_number: order.orderNumber,
            status: 'paid',
            currency: order.currency,
            total_minor: order.totalAmountMinor,
            subtotal_minor: order.totalAmountMinor,
            payment_status: 'paid',
            fulfillment_status: 'unfulfilled',
            risk_level: 'low',
            shipping_address: order.shippingAddress,
            placed_at: order.placedAt,
          });
        }

        return { order, createdOrder };
      }
    );

    return NextResponse.json({
      success: true,
      topic: topicHeader,
      ingestionStatus: result.status,
      message: result.message,
      persistedOrderId: createdOrder?.id,
    });
  } catch (error: any) {
    console.error('Shopify webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
