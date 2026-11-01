import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@storefront-ops/db';
import {
  BillingService,
  SUBSCRIPTION_PLANS,
  type TenantSubscription,
  type UsageMetrics,
} from '@storefront-ops/core';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const billingService = new BillingService();

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  const orgId = session?.organizationId || 'org-acme-prod';

  const rawSub = db.getSubscription(orgId);
  const subscription: TenantSubscription = {
    organizationId: rawSub.organizationId,
    planId: rawSub.planId,
    status: rawSub.status,
    currentPeriodStart: rawSub.currentPeriodStart,
    currentPeriodEnd: rawSub.currentPeriodEnd,
    trialEnd: rawSub.trialEnd,
    cancelAtPeriodEnd: rawSub.cancelAtPeriodEnd,
    gracePeriodEnd: rawSub.gracePeriodEnd,
    stripeCustomerId: rawSub.stripeCustomerId,
    stripeSubscriptionId: rawSub.stripeSubscriptionId,
    isReadOnly: rawSub.isReadOnly,
  };

  const usage: UsageMetrics = db.getUsageMetrics(orgId);
  const plan = SUBSCRIPTION_PLANS[subscription.planId];

  const orderQuota = billingService.checkQuota(subscription, usage, 'orders', 0);
  const skuQuota = billingService.checkQuota(subscription, usage, 'skus', 0);
  const seatQuota = billingService.checkQuota(subscription, usage, 'seats', 0);

  return NextResponse.json({
    subscription,
    plan,
    usage,
    quotas: {
      orders: orderQuota,
      skus: skuQuota,
      seats: seatQuota,
    },
    availablePlans: Object.values(SUBSCRIPTION_PLANS),
  });
}
