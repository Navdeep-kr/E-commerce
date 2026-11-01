import { NextResponse } from 'next/server';

export async function GET() {
  const integrations = [
    {
      id: 'int-1',
      name: 'Shopify Admin API',
      category: 'ecommerce',
      status: 'connected',
      endpoint: '/api/webhooks/shopify',
      lastSyncAt: '1 minute ago',
      metrics: {
        productsSynced: 400,
        ordersIngested: 24890,
        syncErrorsCount: 0,
      },
    },
    {
      id: 'int-2',
      name: 'WooCommerce Store REST API v3',
      category: 'ecommerce',
      status: 'connected',
      endpoint: '/api/webhooks/woocommerce',
      lastSyncAt: '3 minutes ago',
      metrics: {
        productsSynced: 120,
        ordersIngested: 4120,
        syncErrorsCount: 0,
      },
    },
    {
      id: 'int-3',
      name: 'Stripe Payments & Disputes',
      category: 'payments',
      status: 'connected',
      endpoint: '/api/webhooks/stripe',
      lastSyncAt: 'Just now',
      metrics: {
        settledVolumeMinor: 14850000,
        disputesPendingCount: 0,
      },
    },
    {
      id: 'int-4',
      name: 'Shippo & EasyPost Multi-Carrier Aggregator',
      category: 'shipping',
      status: 'connected',
      endpoint: '/api/fulfillment/rates',
      lastSyncAt: '5 minutes ago',
      metrics: {
        labelsPurchasedToday: 142,
        carrierExceptionCount: 3,
      },
    },
  ];

  const deadLetterQueue = [
    {
      id: 'dlq-1',
      integrationName: 'Shopify Admin API',
      eventId: 'evt_shp_failed_9918',
      errorMessage: 'Foreign currency CAD not permitted for domestic warehouse US account',
      retryCount: 2,
      lastAttemptAtIso: '2026-11-01T10:45:00Z',
    },
  ];

  return NextResponse.json({
    integrations,
    deadLetterQueue,
    isAllHealthy: true,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { dlqId } = body;

  return NextResponse.json({
    success: true,
    dlqId,
    message: `Dead Letter Queue item ${dlqId} requeued and reprocessed successfully.`,
  });
}
