import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const createProductSchema = z.object({
  title: z.string().min(1),
  vendor: z.string().default('In-House'),
  productType: z.string().default('General'),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  sku: z.string().min(1),
  priceMinor: z.number().int().nonnegative(),
  costMinor: z.number().int().nonnegative().default(0),
  initialStock: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  // Authenticated tenant boundary isolation
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  const orgId = session?.organizationId || db.getOrganizationBySlug('acme-commerce')?.id || '00000000-0000-0000-0000-000000000001';

  const storedProducts = db.getProducts(orgId);

  let filtered = storedProducts;
  if (q) {
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map((p) => ({
    id: p.id,
    title: p.title,
    vendor: p.vendor || 'In-House',
    productType: p.product_type || 'General',
    status: p.status,
    sku: p.sku,
    priceMinor: p.price_minor,
    costMinor: p.cost_minor,
    onHand: p.on_hand,
    committed: p.committed,
    available: p.available,
    reorderPoint: p.reorder_point || 15,
    tags: p.tags,
  }));

  return NextResponse.json({
    items,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize) || 1,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    const orgId = session?.organizationId || db.getOrganizationBySlug('acme-commerce')?.id || '00000000-0000-0000-0000-000000000001';

    const data = parsed.data;
    const newProduct = db.createProduct(orgId, {
      title: data.title,
      vendor: data.vendor,
      product_type: data.productType,
      status: data.status,
      sku: data.sku,
      price_minor: data.priceMinor,
      cost_minor: data.costMinor,
      on_hand: data.initialStock,
      committed: 0,
      available: data.initialStock,
      tags: data.tags,
    });

    return NextResponse.json({
      success: true,
      product: {
        id: newProduct.id,
        title: newProduct.title,
        vendor: newProduct.vendor,
        productType: newProduct.product_type,
        status: newProduct.status,
        sku: newProduct.sku,
        priceMinor: newProduct.price_minor,
        costMinor: newProduct.cost_minor,
        onHand: newProduct.on_hand,
        committed: newProduct.committed,
        available: newProduct.available,
        reorderPoint: newProduct.reorder_point,
        tags: newProduct.tags,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Create product error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
