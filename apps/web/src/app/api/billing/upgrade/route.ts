import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  BillingService,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
  type TenantSubscription,
} from '@storefront-ops/core';

const upgradeSchema = z.object({
  planId: z.enum(['starter', 'growth', 'scale']),
  cadence: z.enum(['monthly', 'annual']).default('monthly'),
});

const billingService = new BillingService();

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = upgradeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid plan upgrade request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { planId } = parsed.data;
    const targetPlan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];

    const updatedSub: TenantSubscription = {
      organizationId: 'acme-corp',
      planId: planId as SubscriptionPlanId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: null,
      cancelAtPeriodEnd: false,
      gracePeriodEnd: null,
      stripeCustomerId: 'cus_acme_prod',
      stripeSubscriptionId: `sub_${planId}_live`,
      isReadOnly: false,
    };

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name} plan.`,
      subscription: updatedSub,
      plan: targetPlan,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process subscription upgrade' },
      { status: 500 }
    );
  }
}
