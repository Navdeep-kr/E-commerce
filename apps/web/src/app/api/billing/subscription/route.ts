import { NextRequest, NextResponse } from 'next/server';
import {
  BillingService,
  SUBSCRIPTION_PLANS,
  type TenantSubscription,
  type UsageMetrics,
} from '@storefront-ops/core';

const billingService = new BillingService();

// Mock store subscription state
let mockSubscription: TenantSubscription = {
  organizationId: 'acme-corp',
  planId: 'growth',
  status: 'active',
  currentPeriodStart: '2026-11-01T00:00:00Z',
  currentPeriodEnd: '2026-12-01T00:00:00Z',
  trialEnd: null,
  cancelAtPeriodEnd: false,
  gracePeriodEnd: null,
  stripeCustomerId: 'cus_acme_prod',
  stripeSubscriptionId: 'sub_growth_monthly',
  isReadOnly: false,
};

const mockUsage: UsageMetrics = {
  monthlyOrdersUsed: 1420,
  activeSkusCount: 380,
  teamSeatsUsed: 4,
};

export async function GET(_req: NextRequest) {
  const plan = SUBSCRIPTION_PLANS[mockSubscription.planId];

  const orderQuota = billingService.checkQuota(mockSubscription, mockUsage, 'orders', 0);
  const skuQuota = billingService.checkQuota(mockSubscription, mockUsage, 'skus', 0);
  const seatQuota = billingService.checkQuota(mockSubscription, mockUsage, 'seats', 0);

  return NextResponse.json({
    subscription: mockSubscription,
    plan,
    usage: mockUsage,
    quotas: {
      orders: orderQuota,
      skus: skuQuota,
      seats: seatQuota,
    },
    availablePlans: Object.values(SUBSCRIPTION_PLANS),
  });
}
