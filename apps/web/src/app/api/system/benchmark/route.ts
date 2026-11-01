import { NextRequest, NextResponse } from 'next/server';
import { LoadSimulator, CacheService } from '@storefront-ops/core';

const simulator = new LoadSimulator();
const cacheService = new CacheService();

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const totalOrders = json.totalOrders || 200;
    const concurrency = json.concurrency || 10;

    const result = await simulator.runPeakSaleSimulation({
      totalOrders,
      concurrency,
      targetOrdersPerSecond: 50,
      initialStock: totalOrders + 100,
    });

    const cacheTelemetry = cacheService.getTelemetry();

    return NextResponse.json({
      success: true,
      result,
      cacheTelemetry,
      databaseIndexes: [
        { name: 'idx_orders_org_created_id', table: 'orders', type: 'BTREE', status: 'ACTIVE' },
        { name: 'idx_orders_org_status', table: 'orders', type: 'BTREE', status: 'ACTIVE' },
        { name: 'idx_inventory_org_sku', table: 'inventory_levels', type: 'BTREE', status: 'ACTIVE' },
        { name: 'idx_inventory_movements_org_created', table: 'inventory_movements', type: 'BTREE', status: 'ACTIVE' },
        { name: 'idx_customers_org_email', table: 'customers', type: 'BTREE', status: 'ACTIVE' },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Benchmark simulation failed' },
      { status: 500 }
    );
  }
}
