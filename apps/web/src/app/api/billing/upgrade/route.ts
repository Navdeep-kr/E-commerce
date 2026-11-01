import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import {
  BillingService,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
  type TenantSubscription,
} from '@storefront-ops/core';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const upgradeSchema = z.object({
  planId: z.enum(['starter', 'growth', 'scale']),
  cadence: z.enum(['monthly', 'annual']).default('monthly'),
});

const billingService = new BillingService();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    const orgId = session?.organizationId || 'org-acme-prod';

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

    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const rawUpdated = db.updateSubscription(orgId, {
      planId: planId as SubscriptionPlanId,
      status: 'active',
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      gracePeriodEnd: null,
      isReadOnly: false,
    });

    const updatedSub: TenantSubscription = {
      organizationId: rawUpdated.organizationId,
      planId: rawUpdated.planId,
      status: rawUpdated.status,
      currentPeriodStart: rawUpdated.currentPeriodStart,
      currentPeriodEnd: rawUpdated.currentPeriodEnd,
      trialEnd: rawUpdated.trialEnd,
      cancelAtPeriodEnd: rawUpdated.cancelAtPeriodEnd,
      gracePeriodEnd: rawUpdated.gracePeriodEnd,
      stripeCustomerId: rawUpdated.stripeCustomerId,
      stripeSubscriptionId: rawUpdated.stripeSubscriptionId,
      isReadOnly: rawUpdated.isReadOnly,
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
