import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface InAppNotification {
  id: string;
  category: 'orders' | 'inventory' | 'fulfillment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

let mockNotifications: InAppNotification[] = [
  {
    id: 'notif-1',
    category: 'fulfillment',
    title: 'Fulfillment SLA Breach',
    message: '3 orders in Main Warehouse have exceeded their dispatch SLA window.',
    timestamp: '15m ago',
    read: false,
    actionUrl: '/acme-corp/fulfillment',
  },
  {
    id: 'notif-2',
    category: 'inventory',
    title: 'Low Stock Alert: SKU-HOODIE-BLK-M',
    message: 'Only 8 units remain available. Projected stockout date is Nov 4, 2026.',
    timestamp: '42m ago',
    read: false,
    actionUrl: '/acme-corp/inventory',
  },
  {
    id: 'notif-3',
    category: 'orders',
    title: 'High-Value Order Received',
    message: 'Order ORD-8842 placed by Sarah Jenkins ($1,250.00). Priority pack assigned.',
    timestamp: '2h ago',
    read: false,
    actionUrl: '/acme-corp/orders/ord-8842',
  },
  {
    id: 'notif-4',
    category: 'system',
    title: 'Stripe Payout Reconciled',
    message: 'Daily bank transfer of $14,820.50 reconciled with $0.00 drift.',
    timestamp: '5h ago',
    read: true,
    actionUrl: '/acme-corp/finance',
  },
];

const markReadSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  return NextResponse.json({
    notifications: mockNotifications,
    unreadCount,
  });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = markReadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { notificationId, markAll } = parsed.data;

    if (markAll) {
      mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    } else if (notificationId) {
      mockNotifications = mockNotifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
    }

    const unreadCount = mockNotifications.filter((n) => !n.read).length;
    return NextResponse.json({
      success: true,
      notifications: mockNotifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update notification status' },
      { status: 500 }
    );
  }
}
