import { NextResponse } from 'next/server';
import { db } from '@storefront-ops/db';

export async function GET() {
  try {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    // Basic database connectivity probe
    const defaultOrg = db.getOrganizationBySlug('acme-commerce');

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        uptimeSeconds: uptimeSec,
        database: {
          status: defaultOrg ? 'connected' : 'degraded',
          primaryOrg: defaultOrg?.name,
        },
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
