import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReturnsService, type ReturnItemInput } from '@storefront-ops/core';

const createReturnSchema = z.object({
  orderNumber: z.string().min(1),
  deliveryDateIso: z.string().min(1),
  items: z.array(
    z.object({
      orderItemId: z.string(),
      sku: z.string(),
      quantity: z.number().int().positive(),
      unitPriceMinor: z.number().int().nonnegative(),
      reason: z.enum(['wrong_size', 'damaged', 'not_as_described', 'changed_mind', 'defective']),
      isFinalSale: z.boolean().optional(),
    })
  ),
  deductShipping: z.boolean().default(false),
});

export async function GET() {
  const sampleReturns = [
    {
      id: 'ret-1001',
      rmaNumber: 'RMA-90812',
      orderNumber: 'ORD-10842',
      customerName: 'Marcus Vance',
      customerEmail: 'm.vance@example.com',
      sku: 'HOODIE-BLK-M',
      quantity: 1,
      reason: 'wrong_size',
      status: 'received',
      conditionGrade: null,
      refundAmountMinor: 8500,
      createdAt: '2026-10-30T14:10:00Z',
    },
    {
      id: 'ret-1002',
      rmaNumber: 'RMA-90813',
      orderNumber: 'ORD-10839',
      customerName: 'Sarah Jenkins',
      customerEmail: 's.jenkins@example.com',
      sku: 'JACKET-DWN-L',
      quantity: 1,
      reason: 'damaged',
      status: 'in_transit',
      conditionGrade: null,
      refundAmountMinor: 19500,
      createdAt: '2026-10-31T09:20:00Z',
    },
    {
      id: 'ret-1003',
      rmaNumber: 'RMA-90809',
      orderNumber: 'ORD-10825',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.r@example.com',
      sku: 'TEE-WHT-L',
      quantity: 2,
      reason: 'changed_mind',
      status: 'graded',
      conditionGrade: 'restock',
      refundAmountMinor: 5600,
      createdAt: '2026-10-28T16:45:00Z',
    },
  ];

  return NextResponse.json({ returns: sampleReturns });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid return request payload', details: parsed.error.format() }, { status: 400 });
    }

    const { orderNumber, deliveryDateIso, items, deductShipping } = parsed.data;

    // Validate return eligibility window
    const eligibility = ReturnsService.validateReturnEligibility(deliveryDateIso);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 422 });
    }

    // Check for final sale items
    for (const it of items) {
      if (it.isFinalSale) {
        return NextResponse.json(
          { error: `Item ${it.sku} is marked Final Sale and cannot be returned.` },
          { status: 422 }
        );
      }
    }

    const refund = ReturnsService.calculateRefund(items as ReturnItemInput[], deductShipping);
    const rmaNumber = `RMA-${Math.floor(10000 + Math.random() * 90000)}`;

    return NextResponse.json({
      success: true,
      rmaNumber,
      orderNumber,
      status: 'requested',
      prepaidReturnLabelUrl: `https://labels.example.com/${rmaNumber}.pdf`,
      refundSummary: refund,
      instructions: 'Affix the prepaid label to your original packaging and drop off at any USPS location.',
    });
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
  }
}
