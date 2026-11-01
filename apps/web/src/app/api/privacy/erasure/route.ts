import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrivacyComplianceService, type MutablePrivacyDatasets } from '@storefront-ops/core';

const privacyService = new PrivacyComplianceService();

const erasureSchema = z.object({
  customerId: z.string().min(1),
  organizationId: z.string().default('acme-corp'),
  reason: z.string().min(5),
});

let livePrivacyDataset: MutablePrivacyDatasets = {
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
    {
      id: 'cust-2',
      organizationId: 'acme-corp',
      name: 'Marcus Vance',
      email: 'marcus.v@example.com',
      phone: '+14155559812',
      addresses: [{ street: '456 Mission St' }],
      tags: ['loyal'],
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
      messages: [{ sender: 'customer', body: 'Update my address please' }],
    },
  ],
  communications: [
    {
      messageId: 'msg-1',
      customerId: 'cust-1',
      recipient: 'sarah.j@example.com',
      body: 'Order shipped to 123 Market St',
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = erasureSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid erasure request payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { customerId, organizationId, reason } = parsed.data;

    const result = privacyService.executeErasureRequest(
      organizationId,
      customerId,
      reason,
      livePrivacyDataset
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Customer not found or does not belong to organization' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer PII scrubbed cleanly across all tables pursuant to GDPR Article 17.',
      erasureSummary: result.erasureSummary,
      auditLog: result.auditLog,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Erasure request failed' },
      { status: 500 }
    );
  }
}
