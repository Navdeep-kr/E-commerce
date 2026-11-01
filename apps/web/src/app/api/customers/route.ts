import { NextResponse } from 'next/server';
import { CustomerService, type CustomerProfile } from '@storefront-ops/core';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').toLowerCase();
  const segmentFilter = searchParams.get('segment');

  const now = new Date();

  const rawCustomers: CustomerProfile[] = [
    {
      id: 'cust-101',
      email: 'alex.mercer@example.com',
      phone: '+1 212-555-0143',
      firstName: 'Alex',
      lastName: 'Mercer',
      createdAt: '2025-02-14T00:00:00Z',
      lastOrderDateIso: new Date(now.getTime() - 4 * 86400000).toISOString(),
      ordersCount: 14,
      totalSpentMinor: 168000, // $1,680.00
      tags: ['vip', 'early-adopter'],
      addresses: [
        { street1: '142 Grand Street, Apt 4B', city: 'Brooklyn', state: 'NY', zip: '11249', country: 'US', isDefault: true },
      ],
    },
    {
      id: 'cust-102',
      email: 'brianna.hayes@example.com',
      phone: '+1 503-555-0182',
      firstName: 'Brianna',
      lastName: 'Hayes',
      createdAt: '2025-05-10T00:00:00Z',
      lastOrderDateIso: new Date(now.getTime() - 18 * 86400000).toISOString(),
      ordersCount: 6,
      totalSpentMinor: 72000, // $720.00
      tags: ['apparel-preferred'],
      addresses: [
        { street1: '882 Sunset Blvd', city: 'Portland', state: 'OR', zip: '97201', country: 'US', isDefault: true },
      ],
    },
    {
      id: 'cust-103',
      email: 'carlos.r@example.com',
      phone: '+1 512-555-0199',
      firstName: 'Carlos',
      lastName: 'Rivera',
      createdAt: '2025-01-10T00:00:00Z',
      lastOrderDateIso: new Date(now.getTime() - 110 * 86400000).toISOString(),
      ordersCount: 5,
      totalSpentMinor: 48000, // $480.00
      tags: ['at-risk-warning'],
      addresses: [
        { street1: '402 Congress Ave', city: 'Austin', state: 'TX', zip: '78701', country: 'US', isDefault: true },
      ],
    },
    {
      id: 'cust-104',
      email: 'diana.prince@example.com',
      phone: '+1 312-555-0128',
      firstName: 'Diana',
      lastName: 'Prince',
      createdAt: '2026-10-20T00:00:00Z',
      lastOrderDateIso: new Date(now.getTime() - 10 * 86400000).toISOString(),
      ordersCount: 1,
      totalSpentMinor: 9400, // $94.00
      tags: ['first-order-discount'],
      addresses: [
        { street1: '200 E Randolph St', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', isDefault: true },
      ],
    },
    {
      id: 'cust-105',
      email: 'alex.m.work@example.com', // Duplicate candidate for Alex Mercer
      phone: '+1 212-555-0143',
      firstName: 'Alexander',
      lastName: 'Mercer',
      createdAt: '2025-11-01T00:00:00Z',
      lastOrderDateIso: new Date(now.getTime() - 40 * 86400000).toISOString(),
      ordersCount: 2,
      totalSpentMinor: 21000,
      tags: ['duplicate-candidate'],
      addresses: [
        { street1: '142 Grand St', city: 'Brooklyn', state: 'NY', zip: '11249', country: 'US' },
      ],
    },
  ];

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
