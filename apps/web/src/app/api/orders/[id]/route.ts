import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Realistic mock order detail
  const order = {
    id,
    orderNumber: 'ORD-10892',
    channel: 'Shopify US Storefront',
    status: 'ready_to_pack',
    paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    riskLevel: 'low',
    placedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    currency: 'USD',
    subtotalMinor: 17500,
    discountMinor: 1500,
    shippingMinor: 850,
    taxMinor: 1320,
    totalMinor: 18170,
    customer: {
      id: 'cust-901',
      name: 'Jessica Miller',
      email: 'jessica.m@example.com',
      phone: '+1 (555) 234-5678',
      totalSpentMinor: 84500,
      ordersCount: 4,
    },
    shippingAddress: {
      firstName: 'Jessica',
      lastName: 'Miller',
      address1: '742 Evergreen Terrace',
      city: 'Springfield',
      province: 'OR',
      postalCode: '97477',
      country: 'US',
    },
    billingAddress: {
      firstName: 'Jessica',
      lastName: 'Miller',
      address1: '742 Evergreen Terrace',
      city: 'Springfield',
      province: 'OR',
      postalCode: '97477',
      country: 'US',
    },
    lines: [
      {
        id: 'line-1',
        sku: 'HOODIE-BLK-M',
        title: 'Heavyweight Fleece Hoodie',
        variantTitle: 'Black / M',
        quantity: 1,
        fulfilledQuantity: 0,
        returnedQuantity: 0,
        unitPriceMinor: 9500,
        totalPriceMinor: 9500,
        barcode: '84920199201',
      },
      {
        id: 'line-2',
        sku: 'TEE-WHT-M',
        title: 'Vintage Washed Tee',
        variantTitle: 'White / M',
        quantity: 2,
        fulfilledQuantity: 0,
        returnedQuantity: 0,
        unitPriceMinor: 4000,
        totalPriceMinor: 8000,
        barcode: '84920199202',
      },
    ],
    timeline: [
      { id: 'ev-1', event: 'Order placed via Shopify checkout', time: '2 hours ago', user: 'Customer' },
      { id: 'ev-2', event: 'Payment authorized & captured ($181.70)', time: '2 hours ago', user: 'Stripe Gateway' },
      { id: 'ev-3', event: 'Inventory committed at East Coast DC', time: '2 hours ago', user: 'System' },
    ],
    internalNotes: [
      { id: 'note-1', author: 'Alex Mercer', text: 'Customer confirmed address via phone inquiry.', time: '1 hour ago' },
    ],
  };

  return NextResponse.json({ order });
}
