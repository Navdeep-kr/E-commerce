import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MockShippingAdapter } from '@storefront-ops/integrations';

const ratesSchema = z.object({
  from: z.object({
    name: z.string().default('East Coast DC'),
    street1: z.string().default('100 Warehouse Way'),
    city: z.string().default('Philadelphia'),
    state: z.string().default('PA'),
    zip: z.string().default('19104'),
    country: z.string().default('US'),
  }),
  to: z.object({
    name: z.string().min(1),
    street1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(2),
  }),
  parcel: z.object({
    lengthInches: z.number().default(10),
    widthInches: z.number().default(8),
    heightInches: z.number().default(4),
    weightOunces: z.number().default(16),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ratesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid address/parcel input', details: parsed.error.format() }, { status: 400 });
    }

    const { from, to, parcel } = parsed.data;
    const adapter = new MockShippingAdapter();
    const rates = await adapter.getRates(from, to, parcel);

    return NextResponse.json({
      success: true,
      rates,
      cheapestRateId: rates.reduce((min, r) => (r.amountMinor < min.amountMinor ? r : min), rates[0]).rateId,
    });
  } catch (error) {
    console.error('Rates error:', error);
    return NextResponse.json({ error: 'Failed to fetch carrier rates' }, { status: 500 });
  }
}
