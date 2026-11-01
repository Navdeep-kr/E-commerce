import { NextResponse } from 'next/server';
import { generateSeedData } from '@storefront-ops/db/seed';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scale = parseFloat(searchParams.get('scale') || '1.0');

    const seed = generateSeedData(scale);

    return NextResponse.json({
      success: true,
      message: 'Demo workspace populated successfully',
      stats: {
        stores: seed.stores.length,
        warehouses: seed.locations.length,
        products: seed.productsCount,
        variants: seed.variantsCount,
        customers: seed.customersCount,
        orders: seed.ordersCount,
        edgeCases: seed.edgeCases,
      },
    });
  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json({ error: 'Failed to populate demo workspace' }, { status: 500 });
  }
}
