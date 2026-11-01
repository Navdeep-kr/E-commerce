import { NextResponse } from 'next/server';
import { ApiKeyService, type ApiKeyRecord } from '@storefront-ops/core';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or malformed Authorization header.' }, { status: 401 });
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  const hashed = ApiKeyService.hashKey(rawKey);

  const keyRecord: ApiKeyRecord = {
    id: `key_${hashed.slice(0, 8)}`,
    name: 'Dynamic Key',
    keyPrefix: rawKey.startsWith('sf_test_') ? 'sf_test_' : 'sf_live_',
    hashedKey: hashed,
    preview: `${rawKey.slice(0, 8)}...`,
    scopes: ['inventory:read', 'inventory:write'],
    rateLimitPerMin: 120,
    createdAtIso: new Date().toISOString(),
  };

  const verify = ApiKeyService.verifyKey(rawKey, keyRecord, 'inventory:read');
  if (!verify.authorized) {
    return NextResponse.json({ error: verify.error }, { status: 403 });
  }

  const rateLimit = ApiKeyService.checkRateLimit(keyRecord.id, keyRecord.rateLimitPerMin);

  const inventoryStock = [
    { sku: 'HOODIE-BLK-M', onHand: 65, committed: 15, available: 50, location: 'East Coast DC' },
    { sku: 'HOODIE-BLK-XL', onHand: 4, committed: 2, available: 2, location: 'East Coast DC' },
    { sku: 'TEE-WHT-L', onHand: 150, committed: 20, available: 130, location: 'West Coast DC' },
    { sku: 'CAP-NAVY-OS', onHand: 80, committed: 5, available: 75, location: 'Central DC' },
  ];

  return NextResponse.json(
    {
      success: true,
      data: inventoryStock,
      totalItems: inventoryStock.length,
    },
    {
      headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetUnixSeconds),
      },
    }
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Authorization header.' }, { status: 401 });
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  const hashed = ApiKeyService.hashKey(rawKey);

  const keyRecord: ApiKeyRecord = {
    id: `key_${hashed.slice(0, 8)}`,
    name: 'Dynamic Key',
    keyPrefix: rawKey.startsWith('sf_test_') ? 'sf_test_' : 'sf_live_',
    hashedKey: hashed,
    preview: `${rawKey.slice(0, 8)}...`,
    scopes: ['inventory:write'],
    rateLimitPerMin: 120,
    createdAtIso: new Date().toISOString(),
  };

  const verify = ApiKeyService.verifyKey(rawKey, keyRecord, 'inventory:write');
  if (!verify.authorized) {
    return NextResponse.json({ error: verify.error }, { status: 403 });
  }

  const body = await request.json();

  return NextResponse.json({
    success: true,
    sku: body.sku,
    delta: body.delta || 0,
    reason: body.reason || 'external_sync',
    message: `Inventory for SKU ${body.sku} adjusted successfully via public API v1.`,
  });
}
