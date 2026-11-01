import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSeedData } from '@storefront-ops/db';

// In-memory product store initialized from seed
const seed = generateSeedData(0.1);
const products = seed.sampleProducts.map((sp, idx) => ({
  id: `prod_${idx + 1}`,
  title: sp.title,
  vendor: 'Acme Supply Co.',
  productType: 'Apparel',
  status: idx % 10 === 0 ? 'draft' : 'active',
  sku: sp.sku,
  priceMinor: sp.priceMinor,
  costMinor: sp.costMinor,
  onHand: sp.onHand,
  committed: sp.committed,
  available: sp.available,
  reorderPoint: 15,
  tags: ['bestseller', 'fall-collection'],
}));

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

  let filtered = products;
  if (q) {
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

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

    const data = parsed.data;
    const newProduct = {
      id: `prod_${Date.now()}`,
      title: data.title,
      vendor: data.vendor,
      productType: data.productType,
      status: data.status,
      sku: data.sku,
      priceMinor: data.priceMinor,
      costMinor: data.costMinor,
      onHand: data.initialStock,
      committed: 0,
      available: data.initialStock,
      reorderPoint: 10,
      tags: data.tags,
    };

    products.unshift(newProduct);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err) {
    console.error('Create product error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
