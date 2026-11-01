/**
 * Test Suite: Step 17 - SaaS Billing Lifecycle, Quota Enforcement & Superadmin Operations
 * Exit Check: Full Stripe billing lifecycle (trialing -> active -> past_due -> canceled -> reactivated) handles state properly.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BillingService,
  SuperadminService,
  SUBSCRIPTION_PLANS,
  type TenantSubscription,
  type TenantSummary,
} from '../src/index.ts';

describe('Step 17: SaaS Billing & Multi-Tenant Admin', () => {
  const billingService = new BillingService();
  const superadminService = new SuperadminService();

  const createMockSubscription = (
    planId: 'starter' | 'growth' | 'scale' = 'starter',
    status: TenantSubscription['status'] = 'trialing'
  ): TenantSubscription => ({
    organizationId: 'acme-corp',
    planId,
    status,
    currentPeriodStart: '2026-11-01T00:00:00Z',
    currentPeriodEnd: '2026-12-01T00:00:00Z',
    trialEnd: status === 'trialing' ? '2026-11-14T00:00:00Z' : null,
    cancelAtPeriodEnd: false,
    gracePeriodEnd: null,
    stripeCustomerId: 'cus_mock123',
    stripeSubscriptionId: 'sub_mock123',
    isReadOnly: status === 'canceled' || status === 'unpaid',
  });

  describe('Exit Check: Full Stripe Billing Lifecycle State Machine', () => {
    it('executes full lifecycle: trialing -> active -> past_due -> canceled -> reactivated', () => {
      // 1. Initial State: trialing
      let sub = createMockSubscription('starter', 'trialing');
      assert.strictEqual(sub.status, 'trialing');
      assert.strictEqual(sub.isReadOnly, false);

      // 2. Transition: trialing -> active on invoice.payment_succeeded
      sub = billingService.handleStatusTransition(sub, 'active');
      assert.strictEqual(sub.status, 'active');
      assert.strictEqual(sub.isReadOnly, false);
      assert.strictEqual(sub.gracePeriodEnd, null);

      // 3. Transition: active -> past_due on invoice.payment_failed (grace period begins)
      const failureTime = new Date('2026-11-10T12:00:00Z');
      sub = billingService.handleStatusTransition(sub, 'past_due', failureTime);
      assert.strictEqual(sub.status, 'past_due');
      assert.strictEqual(sub.isReadOnly, false); // Still writable during 7-day grace period
      assert.ok(sub.gracePeriodEnd !== null);
      // Grace period should be exactly 7 days later
      const expectedGraceEnd = new Date('2026-11-17T12:00:00Z').toISOString();
      assert.strictEqual(sub.gracePeriodEnd, expectedGraceEnd);

      // 4. Before grace period expires: still active/past_due and writable
      const midGraceTime = new Date('2026-11-14T00:00:00Z');
      const midCheck = billingService.evaluateGracePeriod(sub, midGraceTime);
      assert.strictEqual(midCheck.status, 'past_due');
      assert.strictEqual(midCheck.isReadOnly, false);

      // 5. Transition: past_due -> canceled after grace period expires
      const afterGraceTime = new Date('2026-11-18T00:00:00Z');
      sub = billingService.evaluateGracePeriod(sub, afterGraceTime);
      assert.strictEqual(sub.status, 'canceled');
      assert.strictEqual(sub.isReadOnly, true); // Organization downgraded to read-only mode

      // 6. Transition: canceled -> reactivated on customer renewal
      const reactivateTime = new Date('2026-11-20T10:00:00Z');
      sub = billingService.reactivateSubscription(sub, 'growth', reactivateTime);
      assert.strictEqual(sub.status, 'active');
      assert.strictEqual(sub.planId, 'growth');
      assert.strictEqual(sub.isReadOnly, false);
      assert.strictEqual(sub.gracePeriodEnd, null);
    });

    it('recovers from past_due to active when customer updates payment method within grace period', () => {
      let sub = createMockSubscription('starter', 'active');
      sub = billingService.handleStatusTransition(sub, 'past_due', new Date('2026-11-01T00:00:00Z'));
      assert.strictEqual(sub.status, 'past_due');

      // Payment recovers on day 3
      sub = billingService.handleStatusTransition(sub, 'active', new Date('2026-11-04T00:00:00Z'));
      assert.strictEqual(sub.status, 'active');
      assert.strictEqual(sub.isReadOnly, false);
      assert.strictEqual(sub.gracePeriodEnd, null);
    });
  });

  describe('Usage Metering & Quota Enforcement', () => {
    it('enforces monthly order limits on Starter plan (500 orders max)', () => {
      const sub = createMockSubscription('starter', 'active');

      // 499 orders used, requesting 1 more -> Allowed
      const checkUnder = billingService.checkQuota(
        sub,
        { monthlyOrdersUsed: 499, activeSkusCount: 50, teamSeatsUsed: 2 },
        'orders',
        1
      );
      assert.strictEqual(checkUnder.allowed, true);
      assert.strictEqual(checkUnder.limit, 500);

      // 500 orders used, requesting 1 more -> Blocked
      const checkExceeded = billingService.checkQuota(
        sub,
        { monthlyOrdersUsed: 500, activeSkusCount: 50, teamSeatsUsed: 2 },
        'orders',
        1
      );
      assert.strictEqual(checkExceeded.allowed, false);
      assert.ok(checkExceeded.reason?.includes('Monthly quota exceeded for orders'));
      assert.strictEqual(checkExceeded.percentUsed, 100);
    });

    it('permits unlimited order volume on Scale plan', () => {
      const sub = createMockSubscription('scale', 'active');

      const checkScale = billingService.checkQuota(
        sub,
        { monthlyOrdersUsed: 150000, activeSkusCount: 20000, teamSeatsUsed: 12 },
        'orders',
        100
      );
      assert.strictEqual(checkScale.allowed, true);
      assert.strictEqual(checkScale.limit, -1);
    });

    it('strictly denies all mutations when subscription is in read-only state', () => {
      const sub = createMockSubscription('starter', 'canceled');

      const checkReadOnly = billingService.checkQuota(
        sub,
        { monthlyOrdersUsed: 10, activeSkusCount: 5, teamSeatsUsed: 1 },
        'orders',
        1
      );
      assert.strictEqual(checkReadOnly.allowed, false);
      assert.ok(checkReadOnly.reason?.includes('Organization is in read-only mode'));
    });
  });

  describe('Superadmin Platform Operations & Metrics Aggregation', () => {
    const mockTenants: TenantSummary[] = [
      {
        organizationId: 'org-1',
        name: 'Alpha Apparel',
        slug: 'alpha-apparel',
        ownerEmail: 'owner@alpha.com',
        planId: 'growth',
        status: 'active',
        monthlyOrderVolume: 1200,
        totalSeats: 4,
        createdAt: '2026-08-01T00:00:00Z',
        mrrCents: SUBSCRIPTION_PLANS.growth.monthlyPriceCents, // 14900
        isFrozen: false,
      },
      {
        organizationId: 'org-2',
        name: 'Beta Footwear',
        slug: 'beta-footwear',
        ownerEmail: 'owner@beta.com',
        planId: 'scale',
        status: 'active',
        monthlyOrderVolume: 8500,
        totalSeats: 15,
        createdAt: '2026-06-01T00:00:00Z',
        mrrCents: SUBSCRIPTION_PLANS.scale.monthlyPriceCents, // 39900
        isFrozen: false,
      },
      {
        organizationId: 'org-3',
        name: 'Gamma Goods',
        slug: 'gamma-goods',
        ownerEmail: 'owner@gamma.com',
        planId: 'starter',
        status: 'past_due',
        monthlyOrderVolume: 320,
        totalSeats: 2,
        createdAt: '2026-09-15T00:00:00Z',
        mrrCents: SUBSCRIPTION_PLANS.starter.monthlyPriceCents, // 4900
        isFrozen: false,
      },
      {
        organizationId: 'org-4',
        name: 'Delta Home',
        slug: 'delta-home',
        ownerEmail: 'owner@delta.com',
        planId: 'starter',
        status: 'canceled',
        monthlyOrderVolume: 50,
        totalSeats: 1,
        createdAt: '2026-05-01T00:00:00Z',
        mrrCents: 0,
        isFrozen: false,
      },
      {
        organizationId: 'org-5',
        name: 'Epsilon Tech',
        slug: 'epsilon-tech',
        ownerEmail: 'owner@epsilon.com',
        planId: 'growth',
        status: 'trialing',
        monthlyOrderVolume: 80,
        totalSeats: 3,
        createdAt: '2026-10-25T00:00:00Z',
        mrrCents: 0,
        isFrozen: false,
      },
    ];

    it('calculates total platform MRR, ARR, and churn rate accurately', () => {
      const metrics = superadminService.calculatePlatformMetrics(mockTenants);

      assert.strictEqual(metrics.totalTenants, 5);
      assert.strictEqual(metrics.activeTenants, 2);
      assert.strictEqual(metrics.trialingTenants, 1);
      assert.strictEqual(metrics.pastDueTenants, 1);
      assert.strictEqual(metrics.canceledTenants, 1);

      // MRR = 14900 (growth) + 39900 (scale) + 4900 (past_due starter) = 59700 cents ($597.00)
      assert.strictEqual(metrics.totalMrrCents, 59700);
      assert.strictEqual(metrics.annualRunRateCents, 59700 * 12); // $7,164.00

      // Churn rate = 1 / 5 = 20.0%
      assert.strictEqual(metrics.churnRatePercentage, 20.0);
    });

    it('applies superadmin plan override and generates audit log', () => {
      const sub = createMockSubscription('starter', 'active');
      const result = superadminService.overrideTenantPlan(sub, 'scale', 'VIP Enterprise Partnership');

      assert.strictEqual(result.subscription.planId, 'scale');
      assert.ok(result.auditLog.includes('[SUPERADMIN]'));
      assert.ok(result.auditLog.includes('VIP Enterprise Partnership'));
    });

    it('applies emergency tenant freeze and restores write access on unfreeze', () => {
      const sub = createMockSubscription('growth', 'active');

      // Emergency freeze
      const frozen = superadminService.setTenantFreeze(sub, true, 'Investigation into fraudulent transactions');
      assert.strictEqual(frozen.subscription.isReadOnly, true);
      assert.ok(frozen.auditLog.includes('FROZEN'));

      // Unfreeze
      const unfrozen = superadminService.setTenantFreeze(frozen.subscription, false, 'Cleared by compliance team');
      assert.strictEqual(unfrozen.subscription.isReadOnly, false);
      assert.ok(unfrozen.auditLog.includes('UNFROZEN'));
    });
  });
});
