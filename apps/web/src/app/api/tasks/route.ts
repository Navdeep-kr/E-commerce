import { NextResponse } from 'next/server';
import { z } from 'zod';
import { TaskService, type OpsTask } from '@storefront-ops/core';

export async function GET() {
  const sampleTasks: OpsTask[] = [
    {
      id: 'task-101',
      title: 'Review High-Risk Fraud Hold on ORD-10892',
      description: 'Billing address postal code mismatch; customer placed 3 orders within 15 minutes.',
      status: 'todo',
      priority: 'urgent',
      assignedRole: 'fulfillment',
      assignedUser: 'Marcus Vance',
      dueDateIso: '2026-11-01T16:00:00Z',
      linkedEntities: [
        { type: 'order', id: 'ord-10892', label: 'ORD-10892 ($142.00)' },
        { type: 'customer', id: 'cust-101', label: 'Alex Mercer' },
      ],
      createdAtIso: '2026-11-01T10:15:00Z',
    },
    {
      id: 'task-102',
      title: 'Reorder SKU Below Safety Buffer: HOODIE-BLK-XL',
      description: 'Available stock is 2 units, daily velocity is 4 units/day. Minimum supplier MOQ is 100 units.',
      status: 'todo',
      priority: 'urgent',
      assignedRole: 'inventory',
      assignedUser: 'Sarah Jenkins',
      dueDateIso: '2026-11-02T12:00:00Z',
      linkedEntities: [
        { type: 'product', id: 'HOODIE-BLK-XL', label: 'HOODIE-BLK-XL' },
        { type: 'supplier', id: 'sup-1', label: 'Pacific Mills & Textiles' },
      ],
      createdAtIso: '2026-11-01T11:00:00Z',
    },
    {
      id: 'task-103',
      title: 'Receive Purchase Order PO-2026-089 Dock Inspection',
      description: 'Incoming freight of 200 units from Pacific Mills arrived at bay door #4.',
      status: 'in_progress',
      priority: 'high',
      assignedRole: 'inventory',
      assignedUser: 'David Chen',
      dueDateIso: '2026-11-01T18:00:00Z',
      linkedEntities: [
        { type: 'supplier', id: 'sup-1', label: 'PO-2026-089' },
      ],
      createdAtIso: '2026-11-01T09:30:00Z',
    },
    {
      id: 'task-104',
      title: 'Return Intake Inspection & Grading for RMA-90812',
      description: 'Customer returned 1x HOODIE-BLK-M. Inspect resale condition and grade for restock or quarantine.',
      status: 'blocked',
      priority: 'medium',
      assignedRole: 'fulfillment',
      assignedUser: 'Elena Rostova',
      dueDateIso: '2026-11-03T17:00:00Z',
      linkedEntities: [
        { type: 'return', id: 'ret-1001', label: 'RMA-90812' },
        { type: 'order', id: 'ord-10842', label: 'ORD-10842' },
      ],
      createdAtIso: '2026-10-31T14:00:00Z',
    },
    {
      id: 'task-105',
      title: 'Reconcile October Stripe Payout Deposit',
      description: 'Verified $136,580.00 bank settlement deposit against ledger gross sales and deductions.',
      status: 'done',
      priority: 'low',
      assignedRole: 'finance',
      assignedUser: 'Brianna Hayes',
      dueDateIso: '2026-10-31T20:00:00Z',
      linkedEntities: [
        { type: 'order', id: 'payout-oct', label: 'Stripe Payout Oct 31' },
      ],
      createdAtIso: '2026-10-31T15:00:00Z',
      completedAtIso: '2026-10-31T19:45:00Z',
    },
  ];

  const grouped = TaskService.groupTasksByStatus(sampleTasks);

  return NextResponse.json({
    tasks: sampleTasks,
    grouped,
    totalCount: sampleTasks.length,
  });
}

const updateTaskSchema = z.object({
  taskId: z.string(),
  newStatus: z.enum(['todo', 'in_progress', 'blocked', 'done']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task status update payload', details: parsed.error.format() }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      taskId: parsed.data.taskId,
      status: parsed.data.newStatus,
      message: `Task ${parsed.data.taskId} moved to ${parsed.data.newStatus}.`,
    });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
