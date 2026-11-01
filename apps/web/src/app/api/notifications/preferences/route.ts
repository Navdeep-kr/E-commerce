import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CommunicationService } from '@storefront-ops/core';

const commsService = new CommunicationService();

const optOutSchema = z.object({
  customerId: z.string(),
  marketingOptOut: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = optOutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { customerId, marketingOptOut } = parsed.data;
    const updated = commsService.syncMarketingOptOut(customerId, marketingOptOut);

    return NextResponse.json({
      success: true,
      message: `Omnichannel preferences updated. Marketing opt-out: ${marketingOptOut}. Transactional notifications remain active.`,
      preferences: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
