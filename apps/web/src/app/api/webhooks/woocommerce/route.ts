import { NextResponse } from 'next/server';
import { WooCommerceAdapter, WebhookPipeline } from '@storefront-ops/integrations';
import { db } from '@storefront-ops/db';

const pipeline = new WebhookPipeline();
const woo = new WooCommerceAdapter();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('x-wc-webhook-signature') || '';
    const topicHeader = request.headers.get('x-wc-webhook-topic') || 'order.created';
    const storeUrl = request.headers.get('x-wc-webhook-source') || '';
    const eventIdHeader = request.headers.get('x-wc-webhook-id') || `woo_${Date.now()}`;

    if (sigHeader) {
      const isValid = woo.verifySignature(rawBody, sigHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid WooCommerce signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    let createdOrder: any = null;

    const result = pipeline.ingestWebhook(
      {
        integrationId: storeUrl || 'woocommerce_site_main',
        eventId: eventIdHeader,
        eventType: topicHeader.includes('order') ? 'order.created' : 'inventory.level_set',
        payload,
        receivedAtIso: new Date().toISOString(),
      },
      (p) => {
        const order = woo.normalizeOrder(p);

        // Multi-tenant persistence
        const targetOrg = db.getOrganizationByStoreDomain(storeUrl) || db.getOrganizationBySlug('acme-commerce');
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
    console.error('WooCommerce webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
