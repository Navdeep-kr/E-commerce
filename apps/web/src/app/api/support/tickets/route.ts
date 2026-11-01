import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SupportService, type SupportTicket } from '@storefront-ops/core';

export async function GET() {
  const now = new Date();

  const tickets: SupportTicket[] = [
    {
      id: 'tkt-401',
      ticketNumber: 'TICK-1049',
      customerId: 'cust-101',
      customerName: 'Alex Mercer',
      customerEmail: 'alex.mercer@example.com',
      orderNumber: 'ORD-10892',
      subject: 'Where is my order? Need delivery confirmation for apartment gate',
      priority: 'high',
      status: 'open',
      channel: 'email',
      createdAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      firstResponseDueIso: new Date(now.getTime() + 150 * 60000).toISOString(),
    },
    {
      id: 'tkt-402',
      ticketNumber: 'TICK-1050',
      customerId: 'cust-102',
      customerName: 'Brianna Hayes',
      customerEmail: 'brianna.hayes@example.com',
      orderNumber: 'ORD-10893',
      subject: 'Wrong size received, need to exchange for a Medium',
      priority: 'medium',
      status: 'open',
      channel: 'chat',
      createdAt: new Date(now.getTime() - 40 * 60000).toISOString(),
      firstResponseDueIso: new Date(now.getTime() + 680 * 60000).toISOString(),
    },
    {
      id: 'tkt-403',
      ticketNumber: 'TICK-1045',
      customerId: 'cust-103',
      customerName: 'Carlos Rivera',
      customerEmail: 'carlos.r@example.com',
      orderNumber: 'ORD-10894',
      subject: 'Urgent: Address was entered incorrectly before shipment',
      priority: 'urgent',
      status: 'open',
      channel: 'sms',
      createdAt: new Date(now.getTime() - 50 * 60000).toISOString(),
      firstResponseDueIso: new Date(now.getTime() + 10 * 60000).toISOString(), // 10 mins remaining
    },
  ];

  const enriched = tickets.map((t) => {
    const urgency = SupportService.getSlaUrgency(t.firstResponseDueIso, now);
    return {
      ...t,
      slaUrgency: urgency.status,
      minutesRemaining: urgency.minutesRemaining,
    };
  });

  return NextResponse.json({ tickets: enriched });
}

const macroSchema = z.object({
  template: z.string().min(1),
  variables: z.record(z.string(), z.union([z.string(), z.number()])),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = macroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid macro template payload', details: parsed.error.format() }, { status: 400 });
    }

    const { template, variables } = parsed.data;
    const interpolated = SupportService.interpolateMacro(template, variables);

    return NextResponse.json({
      success: true,
      interpolatedText: interpolated,
    });
  } catch (error) {
    console.error('Macro error:', error);
    return NextResponse.json({ error: 'Failed to process macro' }, { status: 500 });
  }
}
