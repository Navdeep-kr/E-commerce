import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderStateMachine, type OrderStatus } from '@storefront-ops/core';

const transitionSchema = z.object({
  currentStatus: z.string(),
  toStatus: z.string(),
  reason: z.string().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid transition payload', details: parsed.error.format() }, { status: 400 });
    }

    const { currentStatus, toStatus, reason } = parsed.data;

    // Validate state transition through domain state machine
    OrderStateMachine.validateTransition({
      orderId: id,
      fromStatus: currentStatus as OrderStatus,
      toStatus: toStatus as OrderStatus,
      actorId: 'usr-admin',
      actorRole: 'owner_admin',
      reason,
    });

    return NextResponse.json({
      success: true,
      orderId: id,
      previousStatus: currentStatus,
      newStatus: toStatus,
      message: `Order ${id} successfully transitioned from ${currentStatus} to ${toStatus}.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 422 });
  }
}
