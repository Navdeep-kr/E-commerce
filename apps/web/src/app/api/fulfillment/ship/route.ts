import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MockShippingAdapter } from '@storefront-ops/integrations';

const shipSchema = z.object({
  orderId: z.string().min(1),
  rateId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ship payload', details: parsed.error.format() }, { status: 400 });
    }

    const { orderId, rateId } = parsed.data;
    const adapter = new MockShippingAdapter();

    // Buy rate-shopped label
    const label = await adapter.buyLabel(rateId);

    return NextResponse.json({
      success: true,
      orderId,
      status: 'shipped',
      shipment: {
        id: label.shipmentId,
        carrier: label.carrier,
        service: label.service,
        trackingNumber: label.trackingNumber,
        labelUrl: label.labelUrl,
        costMinor: label.costMinor,
      },
      message: `Order ${orderId} successfully packed, labeled, and marked SHIPPED with tracking ${label.trackingNumber}.`,
    });
  } catch (error) {
    console.error('Ship error:', error);
    return NextResponse.json({ error: 'Failed to purchase label and ship' }, { status: 500 });
  }
}
