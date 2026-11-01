/**
 * Billing Service
 * Multi-tenant subscription management, Stripe lifecycle state machine, usage metering, and quota enforcement.
 */

export type SubscriptionPlanId = 'starter' | 'growth' | 'scale';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface PlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  limits: {
    monthlyOrders: number; // -1 for unlimited
    activeSkus: number; // -1 for unlimited
    teamSeats: number;
    customReports: boolean;
    dedicatedApiKeys: boolean;
    aiCopilot: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Essential operations for growing direct-to-consumer brands.',
    monthlyPriceCents: 4900, // $49.00
    annualPriceCents: 49000, // $490.00 (2 months free)
    limits: {
      monthlyOrders: 500,
      activeSkus: 100,
      teamSeats: 2,
      customReports: false,
      dedicatedApiKeys: false,
      aiCopilot: true,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'High-velocity operations with automated wave picking and carrier rate shopping.',
    monthlyPriceCents: 14900, // $149.00
    annualPriceCents: 149000, // $1,490.00
    limits: {
      monthlyOrders: 2500,
      activeSkus: 1000,
      teamSeats: 5,
      customReports: true,
      dedicatedApiKeys: true,
      aiCopilot: true,
    },
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'Enterprise omnichannel operations with unlimited throughput and dedicated support.',
    monthlyPriceCents: 39900, // $399.00
    annualPriceCents: 399000, // $3,990.00
    limits: {
      monthlyOrders: -1, // Unlimited
      activeSkus: -1, // Unlimited
      teamSeats: 20,
      customReports: true,
      dedicatedApiKeys: true,
      aiCopilot: true,
    },
  },
};

export interface TenantSubscription {
  organizationId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEnd: string | null; // Set when past_due
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  isReadOnly: boolean;
}

export interface UsageMetrics {
  monthlyOrdersUsed: number;
  activeSkusCount: number;
  teamSeatsUsed: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  percentUsed: number;
}

export class BillingService {
  /**
   * Transition subscription state following Stripe webhook events
   */
  public handleStatusTransition(
    sub: TenantSubscription,
    newStatus: SubscriptionStatus,
    now: Date = new Date()
  ): TenantSubscription {
    const updated: TenantSubscription = { ...sub };

    switch (newStatus) {
      case 'active': {
        updated.status = 'active';
        updated.gracePeriodEnd = null;
        updated.isReadOnly = false;
        break;
      }

      case 'past_due': {
        updated.status = 'past_due';
        // 7-day grace period for payment resolution before locking into read-only
        const graceEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updated.gracePeriodEnd = graceEnd.toISOString();
        updated.isReadOnly = false; // Still writable during grace period
        break;
      }

      case 'canceled': {
        updated.status = 'canceled';
        updated.gracePeriodEnd = null;
        updated.isReadOnly = true; // Downgraded to read-only
        break;
      }

      case 'unpaid': {
        updated.status = 'unpaid';
        updated.isReadOnly = true;
        break;
      }

      case 'trialing': {
        updated.status = 'trialing';
        updated.isReadOnly = false;
        break;
      }
    }

    return updated;
  }

  /**
   * Check if a past_due subscription has passed its grace period
   */
  public evaluateGracePeriod(sub: TenantSubscription, now: Date = new Date()): TenantSubscription {
    if (sub.status === 'past_due' && sub.gracePeriodEnd) {
      const graceTime = new Date(sub.gracePeriodEnd).getTime();
      if (now.getTime() > graceTime) {
        return {
          ...sub,
          status: 'canceled',
          isReadOnly: true,
        };
      }
    }
    return sub;
  }

  /**
   * Reactivate a canceled subscription
   */
  public reactivateSubscription(
    sub: TenantSubscription,
    planId?: SubscriptionPlanId,
    now: Date = new Date()
  ): TenantSubscription {
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      ...sub,
      planId: planId || sub.planId,
      status: 'active',
      isReadOnly: false,
      gracePeriodEnd: null,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  /**
   * Check quota limits for a given resource
   */
  public checkQuota(
    sub: TenantSubscription,
    usage: UsageMetrics,
    resource: 'orders' | 'skus' | 'seats',
    increment: number = 1
  ): QuotaCheckResult {
    // If tenant is read-only, all mutations are blocked
    if (sub.isReadOnly) {
      return {
        allowed: false,
        reason: 'Subscription is inactive or canceled. Organization is in read-only mode.',
        currentUsage: usage.monthlyOrdersUsed,
        limit: 0,
        percentUsed: 100,
      };
    }

    const plan = SUBSCRIPTION_PLANS[sub.planId];
    if (!plan) {
      throw new Error(`Unknown subscription plan: ${sub.planId}`);
    }

    let current = 0;
    let limit = 0;

    switch (resource) {
      case 'orders':
        current = usage.monthlyOrdersUsed;
        limit = plan.limits.monthlyOrders;
        break;
      case 'skus':
        current = usage.activeSkusCount;
        limit = plan.limits.activeSkus;
        break;
      case 'seats':
        current = usage.teamSeatsUsed;
        limit = plan.limits.teamSeats;
        break;
    }

    // Unlimited quota check
    if (limit === -1) {
      return {
        allowed: true,
        currentUsage: current,
        limit: -1,
        percentUsed: 0,
      };
    }

    const targetUsage = current + increment;
    const allowed = targetUsage <= limit;
    const percentUsed = Number(((current / limit) * 100).toFixed(1));

    if (!allowed) {
      return {
        allowed: false,
        reason: `Monthly quota exceeded for ${resource}. Current usage: ${current}/${limit}. Upgrade to a higher plan to increase capacity.`,
        currentUsage: current,
        limit,
        percentUsed,
      };
    }

    return {
      allowed: true,
      currentUsage: current,
      limit,
      percentUsed,
    };
  }
}
