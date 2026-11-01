/**
 * Superadmin Service
 * Internal SaaS platform back-office, multi-tenant directory, MRR metrics aggregation, and emergency admin controls.
 */

import {
  type TenantSubscription,
  type SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
} from './billing-service.ts';

export interface TenantSummary {
  organizationId: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planId: SubscriptionPlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'frozen';
  monthlyOrderVolume: number;
  totalSeats: number;
  createdAt: string;
  mrrCents: number;
  isFrozen: boolean;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  trialingTenants: number;
  pastDueTenants: number;
  canceledTenants: number;
  frozenTenants: number;
  totalMrrCents: number;
  annualRunRateCents: number;
  churnRatePercentage: number;
}

export class SuperadminService {
  /**
   * Aggregate platform-wide SaaS metrics across all tenants
   */
  public calculatePlatformMetrics(tenants: TenantSummary[]): PlatformMetrics {
    const totalTenants = tenants.length;
    let activeTenants = 0;
    let trialingTenants = 0;
    let pastDueTenants = 0;
    let canceledTenants = 0;
    let frozenTenants = 0;
    let totalMrrCents = 0;

    for (const t of tenants) {
      if (t.isFrozen) {
        frozenTenants++;
      }

      switch (t.status) {
        case 'active':
          activeTenants++;
          totalMrrCents += t.mrrCents;
          break;
        case 'trialing':
          trialingTenants++;
          break;
        case 'past_due':
          pastDueTenants++;
          totalMrrCents += t.mrrCents; // Still counted in MRR until canceled
          break;
        case 'canceled':
          canceledTenants++;
          break;
      }
    }

    const churnRatePercentage =
      totalTenants > 0
        ? Number(((canceledTenants / totalTenants) * 100).toFixed(1))
        : 0;

    return {
      totalTenants,
      activeTenants,
      trialingTenants,
      pastDueTenants,
      canceledTenants,
      frozenTenants,
      totalMrrCents,
      annualRunRateCents: totalMrrCents * 12,
      churnRatePercentage,
    };
  }

  /**
   * Superadmin override: change a tenant's plan directly
   */
  public overrideTenantPlan(
    sub: TenantSubscription,
    newPlanId: SubscriptionPlanId,
    reason: string
  ): { subscription: TenantSubscription; auditLog: string } {
    const plan = SUBSCRIPTION_PLANS[newPlanId];
    if (!plan) {
      throw new Error(`Invalid plan ID: ${newPlanId}`);
    }

    const updated: TenantSubscription = {
      ...sub,
      planId: newPlanId,
      status: 'active',
      isReadOnly: false,
    };

    const auditLog = `[SUPERADMIN] Plan overridden to ${plan.name} (${newPlanId}) for tenant ${sub.organizationId}. Reason: ${reason}`;
    return { subscription: updated, auditLog };
  }

  /**
   * Superadmin action: emergency freeze/unfreeze tenant
   */
  public setTenantFreeze(
    sub: TenantSubscription,
    frozen: boolean,
    reason: string
  ): { subscription: TenantSubscription; auditLog: string } {
    const updated: TenantSubscription = {
      ...sub,
      isReadOnly: frozen,
    };

    const auditLog = `[SUPERADMIN] Tenant ${sub.organizationId} ${
      frozen ? 'FROZEN (read-only enforced)' : 'UNFROZEN (write access restored)'
    }. Reason: ${reason}`;

    return { subscription: updated, auditLog };
  }
}
