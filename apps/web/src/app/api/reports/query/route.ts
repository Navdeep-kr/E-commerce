import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AnalyticsService, METRIC_DICTIONARY, type ReportQueryDefinition } from '@storefront-ops/core';

const queryDefSchema = z.object({
  organizationId: z.string().default('org_acme_corp'),
  dimensions: z.array(z.enum(['date_day', 'channel', 'sku', 'customer_segment', 'order_status'])),
  metrics: z.array(z.string()),
  startDateIso: z.string().default('2026-10-01T00:00:00Z'),
  endDateIso: z.string().default('2026-10-31T23:59:59Z'),
  limit: z.number().int().positive().optional().default(50),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = queryDefSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report query definition', details: parsed.error.format() }, { status: 400 });
    }

    const compiled = AnalyticsService.compileSafeQuery(parsed.data as ReportQueryDefinition);

    // Mock realistic result rows matching requested projections
    const sampleRows = [
      {
        channel: 'Shopify Online Store',
        net_sales: 11250000,
        orders_count: 890,
        aov: 12640,
      },
      {
        channel: 'Wholesale B2B Portal',
        net_sales: 3450000,
        orders_count: 24,
        aov: 143750,
      },
      {
        channel: 'Amazon Marketplace',
        net_sales: 1970000,
        orders_count: 145,
        aov: 13586,
      },
    ];

    return NextResponse.json({
      success: true,
      compiledSql: compiled.sql,
      parameters: compiled.params,
      rows: sampleRows,
      rowCount: sampleRows.length,
      metricDictionary: METRIC_DICTIONARY,
    });
  } catch (error: any) {
    console.error('Report compilation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to compile report query' }, { status: 422 });
  }
}
