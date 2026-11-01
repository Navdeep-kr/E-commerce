import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { InventoryService } from '@storefront-ops/core';
import { db } from '@storefront-ops/db';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { csvContent, dryRun = true } = await request.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Missing csvContent string' }, { status: 400 });
    }

    const validation = InventoryService.parseAndValidateProductCsv(csvContent);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        dryRun,
        totalRows: validation.totalRows,
        validRowsCount: validation.validRowsCount,
        errors: validation.errors,
      }, { status: 422 });
    }

    if (!dryRun) {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      const session = parseSessionToken(token);
      const orgId = session?.organizationId || db.getOrganizationBySlug('acme-commerce')?.id || '00000000-0000-0000-0000-000000000001';

      for (const p of validation.parsedProducts) {
        db.createProduct(orgId, {
          title: p.title,
          sku: p.sku,
          vendor: p.vendor || 'In-House',
          product_type: 'Apparel',
          status: 'active',
          price_minor: p.priceMinor,
          cost_minor: p.costMinor,
          on_hand: p.stock,
          available: p.stock,
          committed: 0,
          reorder_point: 15,
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totalRows: validation.totalRows,
      importedCount: validation.validRowsCount,
      sample: validation.parsedProducts.slice(0, 5),
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Failed to process CSV import' }, { status: 500 });
  }
}
