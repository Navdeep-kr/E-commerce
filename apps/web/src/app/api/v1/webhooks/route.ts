import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OutboundWebhookService, type OutboundWebhookSubscription } from '@storefront-ops/core';

const subscriptions: OutboundWebhookSubscription[] = [
  {
    id: 'wh_sub_01',
    targetUrl: 'https://erp.example.com/webhooks/storefront',
    secret: 'whsec_client_secret_998124',
    subscribedEvents: ['order.created', 'order.shipped', 'inventory.adjusted'],
    enabled: true,
    createdAtIso: '2026-11-01T00:00:00Z',
  },
];

export async function GET() {
  return NextResponse.json({
    subscriptions,
    availableTopics: [
      'order.created',
      'order.shipped',
      'order.cancelled',
      'inventory.adjusted',
      'return.received',
      'customer.created',
    ],
  });
}

const registerWebhookSchema = z.object({
  targetUrl: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if test ping requested
    if (body.action === 'ping') {
      const secret = body.secret || 'whsec_client_secret_998124';
      const pingEvent = JSON.stringify({
        event: 'ping',
        message: 'Storefront Ops webhook handshake verification',
        timestamp: new Date().toISOString(),
      });

      const signed = OutboundWebhookService.signPayload(pingEvent, secret);

      return NextResponse.json({
        success: true,
        headerName: 'X-Storefront-Signature',
        headerValue: signed.headerValue,
        payload: JSON.parse(pingEvent),
        message: 'Webhook ping payload signed with HMAC-SHA256.',
      });
    }

    const parsed = registerWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid webhook payload', details: parsed.error.format() }, { status: 400 });
    }

    const newSub: OutboundWebhookSubscription = {
      id: `wh_sub_${Date.now()}`,
      targetUrl: parsed.data.targetUrl,
      secret: parsed.data.secret || `whsec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      subscribedEvents: parsed.data.events,
      enabled: true,
      createdAtIso: new Date().toISOString(),
    };

    subscriptions.push(newSub);

    return NextResponse.json({
      success: true,
      subscription: newSub,
      message: `Outbound webhook registered for ${newSub.targetUrl}.`,
    });
  } catch (error: any) {
    console.error('Webhook API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to manage webhook' }, { status: 500 });
  }
}
