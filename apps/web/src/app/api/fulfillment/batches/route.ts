import { NextResponse } from 'next/server';
import { FulfillmentService, type PickItem } from '@storefront-ops/core';

export async function GET(request: Request) {
  const rawItems: PickItem[] = [
    { sku: 'TEE-WHT-L', variantTitle: 'Tee (White / L)', binLocation: 'B-04-12', quantity: 2, orderNumber: 'ORD-10892' },
    { sku: 'HOODIE-BLK-M', variantTitle: 'Hoodie (Black / M)', binLocation: 'A-01-05', quantity: 1, orderNumber: 'ORD-10892' },
    { sku: 'CAP-NAVY-OS', variantTitle: 'Cap (Navy)', binLocation: 'A-01-02', quantity: 1, orderNumber: 'ORD-10893' },
    { sku: 'HOODIE-BLK-XL', variantTitle: 'Hoodie (Black / XL)', binLocation: 'A-02-16', quantity: 2, orderNumber: 'ORD-10894' },
    { sku: 'SOCKS-GRY', variantTitle: 'Wool Socks', binLocation: 'C-02-01', quantity: 3, orderNumber: 'ORD-10895' },
  ];

  // Optimize pick path alphabetically by bin sequence
  const optimized = FulfillmentService.optimizePickPath(rawItems);

  return NextResponse.json({
    batchId: 'BATCH-2026-1101',
    zone: 'Zone A & B (Apparel)',
    totalItems: optimized.reduce((acc, it) => acc + it.quantity, 0),
    items: optimized,
  });
}
