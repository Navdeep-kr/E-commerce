import { NextResponse } from 'next/server';
import { ApiKeyService, type ApiKeyRecord } from '@storefront-ops/core';

// Simulated active API keys database
const MOCK_API_KEYS: Record<string, ApiKeyRecord> = {
  // Pre-seeded key for testing: 'sf_live_demo1234567890abcdef12345678'
  [ApiKeyService.hashKey('sf_live_demo1234567890abcdef12345678')]: {
    id: 'key_demo_live',
    name: 'Production ERP Connector',
    keyPrefix: 'sf_live_',
    hashedKey: ApiKeyService.hashKey('sf_live_demo1234567890abcdef12345678'),
    preview: 'sf_live_...5678',
    scopes: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write'],
    rateLimitPerMin: 120,
    createdAtIso: '2026-11-01T00:00:00Z',
  },
};

function authenticateRequest(request: Request, requiredScope: any) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: 'Missing or malformed Authorization header. Expected: "Bearer sf_live_..."' }, { status: 401 }),
    };
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  const hashed = ApiKeyService.hashKey(rawKey);
  const keyRecord = MOCK_API_KEYS[hashed];

  // For developer ease in testing, allow any valid prefixed key
  const activeRecord: ApiKeyRecord = keyRecord || {
    id: `key_${hashed.slice(0, 8)}`,
    name: 'Dynamic Test Key',
    keyPrefix: rawKey.startsWith('sf_test_') ? 'sf_test_' : 'sf_live_',
    hashedKey: hashed,
    preview: `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`,
    scopes: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'webhooks:manage'],
    rateLimitPerMin: 120,
    createdAtIso: new Date().toISOString(),
  };

  const verify = ApiKeyService.verifyKey(rawKey, activeRecord, requiredScope);
  if (!verify.authorized) {
    return {
      authenticated: false,
      response: NextResponse.json({ error: verify.error }, { status: 403 }),
    };
  }

  // Rate Limiting
  const rateLimit = ApiKeyService.checkRateLimit(activeRecord.id, activeRecord.rateLimitPerMin);
  if (!rateLimit.allowed) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetUnixSeconds),
          },
        }
      ),
    };
  }

  return {
    authenticated: true,
    keyRecord: activeRecord,
    rateLimit,
  };
}

export async function GET(request: Request) {
  const auth = authenticateRequest(request, 'orders:read');
  if (!auth.authenticated || !auth.rateLimit) {
    return auth.response!;
  }

  const sampleOrders = [
    {
      id: 'ord-10892',
      orderNumber: 'ORD-10892',
      status: 'shipped',
      customerName: 'Alex Mercer',
      customerEmail: 'alex.mercer@example.com',
      totalAmountMinor: 14200,
      currency: 'USD',
      placedAt: '2026-10-28T14:20:00Z',
      lines: [
        { sku: 'HOODIE-BLK-M', title: 'Heavyweight Fleece Hoodie (Black / M)', quantity: 1, unitPriceMinor: 8500 },
        { sku: 'TEE-WHT-L', title: 'Classic Cotton Tee (White / L)', quantity: 2, unitPriceMinor: 2850 },
      ],
    },
    {
      id: 'ord-10893',
      orderNumber: 'ORD-10893',
      status: 'processing',
      customerName: 'Brianna Hayes',
      customerEmail: 'brianna.hayes@example.com',
      totalAmountMinor: 3800,
      currency: 'USD',
      placedAt: '2026-10-29T10:15:00Z',
      lines: [
        { sku: 'CAP-NAVY-OS', title: 'Signature Logo Cap (Navy / OS)', quantity: 1, unitPriceMinor: 3800 },
      ],
    },
  ];

  return NextResponse.json(
    {
      success: true,
      data: sampleOrders,
      pagination: { totalCount: sampleOrders.length, page: 1, pageSize: 50 },
    },
    {
      headers: {
        'X-RateLimit-Limit': String(auth.rateLimit.limit),
        'X-RateLimit-Remaining': String(auth.rateLimit.remaining),
        'X-RateLimit-Reset': String(auth.rateLimit.resetUnixSeconds),
      },
    }
  );
}

export async function POST(request: Request) {
  const auth = authenticateRequest(request, 'orders:write');
  if (!auth.authenticated || !auth.rateLimit) {
    return auth.response!;
  }

  const body = await request.json();

  return NextResponse.json(
    {
      success: true,
      orderId: `ord_${Date.now()}`,
      orderNumber: body.orderNumber || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'pending',
      message: 'Order created via public REST API v1.',
    },
    {
      status: 201,
      headers: {
        'X-RateLimit-Limit': String(auth.rateLimit.limit),
        'X-RateLimit-Remaining': String(auth.rateLimit.remaining),
        'X-RateLimit-Reset': String(auth.rateLimit.resetUnixSeconds),
      },
    }
  );
}
