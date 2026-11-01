import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReturnsService, type ReturnItemInput, type ReturnConditionGrade } from '@storefront-ops/core';

const gradeSchema = z.object({
  orderId: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitPriceMinor: z.number().int().positive(),
  grade: z.enum(['restock', 'quarantine', 'dispose']),
  targetBin: z.string().default('R-01-A'),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: returnId } = await context.params;
    const body = await request.json();
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid grading payload', details: parsed.error.format() }, { status: 400 });
    }

    const { orderId, sku, quantity, unitPriceMinor, grade, targetBin } = parsed.data;

    const returnItem: ReturnItemInput = {
      orderItemId: `item-${sku}`,
      sku,
      quantity,
      unitPriceMinor,
      reason: 'not_as_described',
    };

    // Process intake with ReturnsService
    const intakeResult = ReturnsService.processWarehouseIntake(
      returnId,
      orderId,
      returnItem,
      grade as ReturnConditionGrade,
      targetBin
    );

    return NextResponse.json({
      success: true,
      returnId,
      status: 'graded',
      intake: intakeResult,
      message: intakeResult.shouldRestock
        ? `Item graded RESTOCK: +${quantity} added to inventory at bin ${targetBin}. Refund of $${(intakeResult.refundSummary.netRefundMinor / 100).toFixed(2)} issued.`
        : `Item graded ${grade.toUpperCase()}: Routed to inspection/write-off. Refund of $${(intakeResult.refundSummary.netRefundMinor / 100).toFixed(2)} issued.`,
    });
  } catch (error) {
    console.error('Grade return error:', error);
    return NextResponse.json({ error: 'Failed to process return grading' }, { status: 500 });
  }
}
