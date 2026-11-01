import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSchema = {
    openapi: '3.1.0',
    info: {
      title: 'Storefront Ops Public REST API',
      version: '1.0.0',
      description: 'Production REST API for external third-party developers, ERP integrations, and custom headless storefronts. Authenticate using Bearer API keys (`sf_live_...` or `sf_test_...`).',
      contact: {
        name: 'Developer Support',
        url: 'https://storefrontops.example.com/docs',
        email: 'api-support@example.com',
      },
    },
    servers: [
      {
        url: 'https://api.storefrontops.com/api/v1',
        description: 'Production API Gateway',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key (sf_live_... / sf_test_...)',
          description: 'Pass your Storefront Ops API key in the Authorization header: `Authorization: Bearer sf_live_...`',
        },
      },
      schemas: {
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'] },
            customerName: { type: 'string' },
            customerEmail: { type: 'string' },
            totalAmountMinor: { type: 'integer', description: 'Total order value in minor units (cents)' },
            currency: { type: 'string', default: 'USD' },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string' },
                  title: { type: 'string' },
                  quantity: { type: 'integer' },
                  unitPriceMinor: { type: 'integer' },
                },
              },
            },
          },
        },
        InventoryItem: {
          type: 'object',
          properties: {
            sku: { type: 'string' },
            onHand: { type: 'integer' },
            committed: { type: 'integer' },
            available: { type: 'integer' },
            locationName: { type: 'string' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/orders': {
        get: {
          summary: 'List Orders',
          description: 'Returns a paginated list of orders for the authenticated organization. Requires `orders:read` scope.',
          responses: {
            '200': {
              description: 'Successful response',
              headers: {
                'X-RateLimit-Limit': { schema: { type: 'integer' } },
                'X-RateLimit-Remaining': { schema: { type: 'integer' } },
                'X-RateLimit-Reset': { schema: { type: 'integer' } },
              },
            },
            '401': { description: 'Missing or invalid API key' },
            '403': { description: 'Insufficient scope' },
            '429': { description: 'Rate limit exceeded' },
          },
        },
        post: {
          summary: 'Create or Sync Order',
          description: 'Ingest an external order into Storefront Ops. Requires `orders:write` scope.',
          responses: {
            '201': { description: 'Order created' },
          },
        },
      },
      '/inventory': {
        get: {
          summary: 'List Stock Levels',
          description: 'Fetch multi-location available stock. Requires `inventory:read` scope.',
          responses: {
            '200': { description: 'Stock levels list' },
          },
        },
      },
      '/webhooks': {
        post: {
          summary: 'Register Webhook Subscription',
          description: 'Subscribe to real-time events signed with HMAC-SHA256. Requires `webhooks:manage` scope.',
          responses: {
            '201': { description: 'Webhook registered' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSchema);
}
