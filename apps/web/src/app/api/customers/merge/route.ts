import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CustomerService, type CustomerProfile } from '@storefront-ops/core';

const mergeSchema = z.object({
  primaryId: z.string().min(1),
  secondaryId: z.string().min(1),
  primaryProfile: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    createdAt: z.string(),
    lastOrderDateIso: z.string().optional(),
    ordersCount: z.number(),
    totalSpentMinor: z.number(),
    tags: z.array(z.string()),
    addresses: z.array(z.any()),
  }),
  secondaryProfile: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    createdAt: z.string(),
    lastOrderDateIso: z.string().optional(),
    ordersCount: z.number(),
    totalSpentMinor: z.number(),
    tags: z.array(z.string()),
    addresses: z.array(z.any()),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mergeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid merge payload', details: parsed.error.format() }, { status: 400 });
    }

    const { primaryProfile, secondaryProfile } = parsed.data;

    const mergeResult = CustomerService.mergeProfiles(
      primaryProfile as CustomerProfile,
      secondaryProfile as CustomerProfile
    );

    return NextResponse.json({
      success: true,
      mergedProfile: mergeResult.updatedPrimary,
      archivedProfile: mergeResult.archivedSecondary,
      message: `Successfully merged "${secondaryProfile.email}" into "${primaryProfile.email}". Combined ${mergeResult.updatedPrimary.ordersCount} orders and $${(mergeResult.updatedPrimary.totalSpentMinor / 100).toFixed(2)} total spend.`,
    });
  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json({ error: 'Failed to merge customer profiles' }, { status: 500 });
  }
}
