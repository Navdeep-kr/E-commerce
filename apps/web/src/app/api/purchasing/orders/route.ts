import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PurchasingService, type PoLineItem } from '@storefront-ops/core';

export async function GET() {
  const purchaseOrders = [
    {
      id: 'po-101',
      poNumber: 'PO-2026-089',
      supplierName: 'Pacific Mills & Textiles',
      supplierCode: 'PAC-MILLS',
      status: 'confirmed',
      orderDate: '2026-10-24T00:00:00Z',
      expectedDeliveryDate: '2026-11-07T00:00:00Z',
      itemsCount: 300,
      totalGoodsMinor: 480000, // $4,800.00
      freightCostMinor: 35000, // $350.00
      customsDutiesMinor: 12500, // $125.00
      totalLandedCostMinor: 527500, // $5,275.00
      lines: [
        { id: 'l-1', sku: 'HOODIE-BLK-M', title: 'Heavyweight Fleece Hoodie (Black / M)', quantityOrdered: 100, quantityReceived: 0, unitCostMinor: 2400 },
        { id: 'l-2', sku: 'HOODIE-BLK-XL', title: 'Heavyweight Fleece Hoodie (Black / XL)', quantityOrdered: 100, quantityReceived: 0, unitCostMinor: 2400 },
      ],
    },
    {
      id: 'po-102',
      poNumber: 'PO-2026-090',
      supplierName: 'Atlas Garment Manufacturing',
      supplierCode: 'ATLAS-GARMENT',
      status: 'sent',
      orderDate: '2026-10-28T00:00:00Z',
      expectedDeliveryDate: '2026-11-18T00:00:00Z',
      itemsCount: 500,
      totalGoodsMinor: 400000,
      freightCostMinor: 28000,
      customsDutiesMinor: 0,
      totalLandedCostMinor: 428000,
      lines: [
        { id: 'l-3', sku: 'TEE-WHT-L', title: 'Classic Cotton Tee (White / L)', quantityOrdered: 500, quantityReceived: 0, unitCostMinor: 800 },
      ],
    },
  ];

  return NextResponse.json({ purchaseOrders });
}

const createPoSchema = z.object({
  supplierName: z.string().min(1),
  supplierCode: z.string().min(1),
  lines: z.array(
    z.object({
      id: z.string(),
      sku: z.string(),
      title: z.string(),
      quantityOrdered: z.number().int().positive(),
      quantityReceived: z.number().int().nonnegative().default(0),
      unitCostMinor: z.number().int().positive(),
      weightOz: z.number().optional(),
    })
  ),
  freightCostMinor: z.number().int().nonnegative().default(0),
  customsDutiesMinor: z.number().int().nonnegative().default(0),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createPoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid PO payload', details: parsed.error.format() }, { status: 400 });
    }

    const { supplierName, supplierCode, lines, freightCostMinor, customsDutiesMinor } = parsed.data;

    const totalLandedCostMinor = freightCostMinor + customsDutiesMinor;
    const landedCostAllocation = PurchasingService.allocateLandedCost(
      lines as PoLineItem[],
      totalLandedCostMinor,
      'value'
    );

    const totalGoodsMinor = lines.reduce((acc, l) => acc + l.quantityOrdered * l.unitCostMinor, 0);
    const poNumber = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    return NextResponse.json({
      success: true,
      poNumber,
      supplierName,
      status: 'draft',
      totalGoodsMinor,
      totalLandedCostMinor: totalGoodsMinor + totalLandedCostMinor,
      landedCostAllocation,
      message: `Purchase Order ${poNumber} created successfully with landed costs allocated.`,
    });
  } catch (error) {
    console.error('PO creation error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
