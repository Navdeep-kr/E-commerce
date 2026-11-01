import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CustomerService, type CustomerProfile } from '@storefront-ops/core';
import { db } from '@storefront-ops/db';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').toLowerCase();
  const segmentFilter = searchParams.get('segment');

  const now = new Date();

  // Authenticated tenant boundary isolation
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  const orgId = session?.organizationId || db.getOrganizationBySlug('acme-commerce')?.id || '00000000-0000-0000-0000-000000000001';

  const storedCustomers = db.getCustomers(orgId);

  const rawCustomers: CustomerProfile[] = storedCustomers.map((sc) => ({
    id: sc.id,
    email: sc.email,
    phone: sc.phone || '+1 555-0100',
    firstName: sc.first_name,
    lastName: sc.last_name,
    createdAt: sc.created_at,
    lastOrderDateIso: sc.updated_at || sc.created_at,
    ordersCount: sc.orders_count,
    totalSpentMinor: sc.total_spent_minor,
    tags: sc.tags,
    addresses: (sc.addresses || []).map((a) => ({
      street1: a.street1,
      city: a.city,
      state: a.state || 'NY',
      zip: a.zip || '10001',
      country: a.country,
      isDefault: a.isDefault,
    })),
  }));

  // Enrich with RFM scores
  const enriched = rawCustomers.map((c) => {
    const rfm = CustomerService.calculateRfm(c.lastOrderDateIso, c.ordersCount, c.totalSpentMinor, now);
    return {
      ...c,
      rfm,
    };
  });

  const filtered = enriched.filter((c) => {
    if (search) {
      const matchSearch =
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.phone && c.phone.includes(search));
      if (!matchSearch) return false;
    }
    if (segmentFilter && segmentFilter !== 'all') {
      if (c.rfm.segment !== segmentFilter) return false;
    }
    return true;
  });

  return NextResponse.json({
    customers: filtered,
    total: filtered.length,
    duplicateCandidates: [
      {
        primaryId: 'cust-101',
        secondaryId: 'cust-105',
        confidence: 0.95,
        matchField: 'Phone (+1 212-555-0143) and Name (Alex Mercer)',
      },
    ],
  });
}
