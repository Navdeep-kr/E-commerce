import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrivacyComplianceService, type MutablePrivacyDatasets } from '@storefront-ops/core';

const privacyService = new PrivacyComplianceService();

const exportSchema = z.object({
  customerId: z.string().min(1),
  organizationId: z.string().default('acme-corp'),
});

const sampleDataset: MutablePrivacyDatasets = {
  customers: [
    {
      id: 'cust-1',
      organizationId: 'acme-corp',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+14155552671',
      addresses: [{ street: '123 Market St', city: 'San Francisco', zip: '94105' }],
      tags: ['vip', 'champions'],
    },
  ],
  orders: [
    {
      id: 'ord-101',
      organizationId: 'acme-corp',
      customerId: 'cust-1',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.j@example.com',
      shippingAddress: '123 Market St, San Francisco, CA 94105',
      totalCents: 12500,
      financialStatus: 'paid',
    },
  ],
  tickets: [
    {
      id: 'tck-1',
      organizationId: 'acme-corp',
      customerId: 'cust-1',
      requesterName: 'Sarah Jenkins',
      messages: [{ sender: 'customer', body: 'Can you update my tracking link?' }],
    },
  ],
  communications: [
    {
      messageId: 'msg-1',
      customerId: 'cust-1',
      recipient: 'sarah.j@example.com',
      body: 'Your order ORD-101 has shipped via UPS.',
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = exportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid export request payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { customerId, organizationId } = parsed.data;

    const exportPackage = privacyService.generateCustomerDataExport(
      organizationId,
      customerId,
      sampleDataset
    );

    if (!exportPackage) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data Subject Access Request (DSAR) export generated successfully.',
      exportPackage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Data export generation failed' },
      { status: 500 }
    );
  }
}
