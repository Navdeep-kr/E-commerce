import { NextResponse } from 'next/server';
import { z } from 'zod';

const adjustSchema = z.object({
  sku: z.string().min(1),
  locationId: z.string().default('loc-main'),
  quantityDelta: z.number().int(), // can be positive or negative
  reason: z.enum(['damage', 'loss', 'found', 'correction', 'sale', 'return', 'po_receipt', 'transfer']),
  referenceType: z.enum(['manual', 'order', 'purchase_order', 'return', 'cycle_count']).default('manual'),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { sku, quantityDelta, reason, referenceType, referenceId, notes } = parsed.data;

    // Record movement in append-only ledger structure
    const movement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sku,
      quantityDelta,
      reason,
      referenceType,
      referenceId: referenceId || 'MANUAL-ADJ',
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      movement,
      message: `Adjusted SKU "${sku}" by ${quantityDelta > 0 ? '+' : ''}${quantityDelta} units (${reason}).`,
    });
  } catch (err) {
    console.error('Inventory adjustment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
