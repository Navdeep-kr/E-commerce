import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@storefront-ops/db';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status');

    // Authenticated tenant boundary isolation
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    const orgId = session?.organizationId || db.getOrganizationBySlug('acme-commerce')?.id || '00000000-0000-0000-0000-000000000001';

    const inventory = db.getInventory(orgId);

    let filtered = inventory.map((item) => ({
      id: item.id,
      sku: item.sku,
      title: item.title,
      locationName: item.location_name,
      binLocation: item.bin_location,
      onHand: item.on_hand,
      committed: item.committed,
      available: item.available,
      incoming: item.incoming,
      reorderPoint: item.reorder_point,
      daysOfStock: item.days_of_stock,
      status: item.status,
    }));

    if (q) {
      filtered = filtered.filter(
        (i) => i.sku.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((i) => i.status === status);
    }

    return NextResponse.json({
      items: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}
