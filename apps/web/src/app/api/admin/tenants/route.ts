import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SuperadminService,
  SUBSCRIPTION_PLANS,
  type TenantSummary,
  type SubscriptionPlanId,
} from '@storefront-ops/core';

const superadminService = new SuperadminService();

let mockTenants: TenantSummary[] = [
  {
    organizationId: 'org-acme',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    ownerEmail: 'admin@acme-corp.com',
    planId: 'growth',
    status: 'active',
    monthlyOrderVolume: 1420,
    totalSeats: 4,
    createdAt: '2026-07-15T00:00:00Z',
    mrrCents: SUBSCRIPTION_PLANS.growth.monthlyPriceCents,
    isFrozen: false,
  },
  {
    organizationId: 'org-nexus',
    name: 'Nexus Supply Co',
    slug: 'nexus-supply',
    ownerEmail: 'ops@nexus.com',
    planId: 'scale',
    status: 'active',
    monthlyOrderVolume: 12400,
    totalSeats: 16,
    createdAt: '2026-04-10T00:00:00Z',
    mrrCents: SUBSCRIPTION_PLANS.scale.monthlyPriceCents,
    isFrozen: false,
  },
  {
    organizationId: 'org-solis',
    name: 'Solis Atelier',
    slug: 'solis-atelier',
    ownerEmail: 'founder@solis.com',
    planId: 'starter',
    status: 'past_due',
    monthlyOrderVolume: 340,
    totalSeats: 2,
    createdAt: '2026-09-01T00:00:00Z',
    mrrCents: SUBSCRIPTION_PLANS.starter.monthlyPriceCents,
    isFrozen: false,
  },
  {
    organizationId: 'org-kinesis',
    name: 'Kinesis Athletics',
    slug: 'kinesis-athletics',
    ownerEmail: 'billing@kinesis.com',
    planId: 'growth',
    status: 'trialing',
    monthlyOrderVolume: 95,
    totalSeats: 3,
    createdAt: '2026-10-22T00:00:00Z',
    mrrCents: 0,
    isFrozen: false,
  },
  {
    organizationId: 'org-vanguard',
    name: 'Vanguard Vintage',
    slug: 'vanguard-vintage',
    ownerEmail: 'support@vanguard.com',
    planId: 'starter',
    status: 'canceled',
    monthlyOrderVolume: 0,
    totalSeats: 1,
    createdAt: '2026-03-05T00:00:00Z',
    mrrCents: 0,
    isFrozen: false,
  },
];

const updateTenantSchema = z.object({
  organizationId: z.string(),
  action: z.enum(['override_plan', 'toggle_freeze']),
  planId: z.enum(['starter', 'growth', 'scale']).optional(),
  isFrozen: z.boolean().optional(),
  reason: z.string().min(3),
});

export async function GET(_req: NextRequest) {
  const metrics = superadminService.calculatePlatformMetrics(mockTenants);
  return NextResponse.json({
    tenants: mockTenants,
    metrics,
  });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = updateTenantSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid superadmin action payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { organizationId, action, planId, isFrozen, reason } = parsed.data;
    const tenantIndex = mockTenants.findIndex((t) => t.organizationId === organizationId);

    if (tenantIndex === -1) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = mockTenants[tenantIndex];
    let auditMessage = '';

    if (action === 'override_plan' && planId) {
      const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
      tenant.planId = planId as SubscriptionPlanId;
      tenant.mrrCents = plan.monthlyPriceCents;
      tenant.status = 'active';
      tenant.isFrozen = false;
      auditMessage = `[SUPERADMIN] Overrode plan to ${plan.name} for ${tenant.name}. Reason: ${reason}`;
    } else if (action === 'toggle_freeze' && typeof isFrozen === 'boolean') {
      tenant.isFrozen = isFrozen;
      tenant.status = isFrozen ? 'frozen' : 'active';
      auditMessage = `[SUPERADMIN] ${isFrozen ? 'Froze' : 'Unfroze'} tenant ${tenant.name}. Reason: ${reason}`;
    }

    mockTenants[tenantIndex] = tenant;
    const metrics = superadminService.calculatePlatformMetrics(mockTenants);

    return NextResponse.json({
      success: true,
      tenant,
      metrics,
      auditLog: auditMessage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Superadmin action failed' },
      { status: 500 }
    );
  }
}
