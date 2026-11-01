import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MarketingService, type DiscountRule } from '@storefront-ops/core';

export async function GET() {
  const discounts: DiscountRule[] = [
    {
      id: 'disc-1',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minSpendMinor: 5000,
      stackingRule: 'stackable_with_shipping',
      maxUsageTotal: 1000,
      currentUsageCount: 412,
      maxUsagePerCustomer: 1,
    },
    {
      id: 'disc-2',
      code: 'FREESHIP',
      type: 'free_shipping',
      value: 0,
      minSpendMinor: 7500,
      stackingRule: 'stackable_with_shipping',
      maxUsageTotal: 5000,
      currentUsageCount: 1840,
    },
    {
      id: 'disc-3',
      code: 'TIERED-FALL',
      type: 'tiered',
      value: 0,
      tierThresholds: [
        { spendMinor: 10000, discountMinor: 1500 },
        { spendMinor: 20000, discountMinor: 4000 },
      ],
      stackingRule: 'exclusive',
      maxUsageTotal: 500,
      currentUsageCount: 89,
    },
    {
      id: 'disc-4',
      code: 'VIP25OFF',
      type: 'fixed_amount',
      value: 2500, // $25.00 off
      minSpendMinor: 12000,
      stackingRule: 'unrestricted',
      maxUsageTotal: 200,
      currentUsageCount: 64,
    },
  ];

  return NextResponse.json({ discounts });
}

const createDiscountSchema = z.object({
  code: z.string().min(2),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'tiered', 'bogo']),
  value: z.number().nonnegative(),
  minSpendMinor: z.number().nonnegative().optional(),
  stackingRule: z.enum(['exclusive', 'stackable_with_shipping', 'unrestricted']),
  maxUsageTotal: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createDiscountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid discount payload', details: parsed.error.format() }, { status: 400 });
    }

    const newDiscount: DiscountRule = {
      id: `disc_${Date.now()}`,
      code: parsed.data.code.toUpperCase().trim(),
      type: parsed.data.type,
      value: parsed.data.value,
      minSpendMinor: parsed.data.minSpendMinor,
      stackingRule: parsed.data.stackingRule,
      maxUsageTotal: parsed.data.maxUsageTotal,
      currentUsageCount: 0,
    };

    return NextResponse.json({
      success: true,
      discount: newDiscount,
      message: `Discount code ${newDiscount.code} created successfully.`,
    });
  } catch (error) {
    console.error('Create discount error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
