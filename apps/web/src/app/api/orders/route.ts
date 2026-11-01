import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderEngine, IdempotencyGuard } from '@storefront-ops/core';
import { generateSeedData } from '@storefront-ops/db';

// Initialize in-memory realistic order repository from seed
const seed = generateSeedData(0.05);
const ordersStore = seed.sampleOrders.map((so, idx) => ({
  id: so.id,
  orderNumber: so.orderNumber,
  customerName: `Customer ${idx + 1}`,
  customerEmail: so.customerEmail,
  channel: idx % 3 === 0 ? 'WooCommerce UK' : 'Shopify US',
  status: so.status,
  paymentStatus: so.status === 'pending_payment' ? 'unpaid' : so.status === 'cancelled' ? 'voided' : 'paid',
  fulfillmentStatus: ['packed', 'shipped', 'delivered'].includes(so.status)
    ? 'fulfilled'
    : so.status === 'partially_fulfilled'
    ? 'partially_fulfilled'
    : 'unfulfilled',
  totalMinor: so.totalMinor,
  currency: 'USD',
  itemsCount: (idx % 3) + 1,
  riskLevel: so.riskLevel,
  shippingMethod: idx % 2 === 0 ? 'USPS Priority Mail' : 'UPS Ground',
  placedAt: so.placedAt,
  tags: so.riskLevel === 'high' ? ['fraud-review'] : ['standard'],
}));

const createOrderSchema = z.object({
  idempotencyKey: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  channel: z.string().default('Manual / Phone Order'),
  lines: z.array(
    z.object({
      sku: z.string().min(1),
      variantTitle: z.string().optional(),
      quantity: z.number().int().positive(),
      unitPriceMinor: z.number().int().nonnegative(),
    })
  ).min(1),
  discountMinor: z.number().int().nonnegative().default(0),
  shippingMinor: z.number().int().nonnegative().default(0),
  taxBasisPoints: z.number().int().nonnegative().default(0),
  shippingAddress: z.object({
    address1: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
  }),
  billingAddress: z.object({
    address1: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
  }),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const status = searchParams.get('status');
  const risk = searchParams.get('risk');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  let filtered = ordersStore;

  if (q) {
    filtered = filtered.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((o) => o.status === status);
  }

  if (risk && risk !== 'all') {
    filtered = filtered.filter((o) => o.riskLevel === risk);
  }

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize) || 1,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Idempotency check: prevent duplicate creations from retry storms
    const reservation = IdempotencyGuard.checkAndReserve(data.idempotencyKey, `ord_${Date.now()}`);
    if (reservation.isDuplicate) {
      const existing = ordersStore.find((o) => o.id === reservation.existingOrderId);
      return NextResponse.json({
        success: true,
        message: 'Order already exists (idempotent replay)',
        order: existing,
      }, { status: 200 });
    }

    // Exact totals calculation
    const totals = OrderEngine.calculateTotals(
      data.lines,
      data.discountMinor,
      data.shippingMinor,
      data.taxBasisPoints
    );

    // Risk evaluation
    const risk = OrderEngine.evaluateRisk({
      orderTotalMinor: totals.totalMinor,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      customerPreviousOrdersCount: 1,
      failedPaymentAttemptsCount: 0,
      email: data.customerEmail,
    });

    const newOrder = {
      id: reservation.existingOrderId || `ord_${Date.now()}`,
      orderNumber: `ORD-${10000 + ordersStore.length + 1}`,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      channel: data.channel,
      status: (risk.recommendation === 'auto_hold' ? 'on_hold' : 'paid') as any,
      paymentStatus: 'paid',
      fulfillmentStatus: 'unfulfilled',
      totalMinor: totals.totalMinor,
      currency: totals.currency,
      itemsCount: data.lines.reduce((acc, l) => acc + l.quantity, 0),
      riskLevel: risk.riskLevel,
      shippingMethod: 'Standard Courier',
      placedAt: new Date().toISOString(),
      tags: risk.flags.length > 0 ? ['risk-review'] : ['manual-order'],
    };

    ordersStore.unshift(newOrder);

    return NextResponse.json({
      success: true,
      order: newOrder,
      riskAssessment: risk,
    }, { status: 201 });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
