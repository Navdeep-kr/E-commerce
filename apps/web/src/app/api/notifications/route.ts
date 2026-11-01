import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

interface InAppNotification {
  id: string;
  category: 'orders' | 'inventory' | 'fulfillment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface BaseNotificationItem {
  id: string;
  category: 'orders' | 'inventory' | 'fulfillment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  path: string;
}

const BASE_NOTIFICATIONS: BaseNotificationItem[] = [
  {
    id: 'notif-1',
    category: 'fulfillment',
    title: 'Fulfillment SLA Breach',
    message: '3 orders in Main Warehouse have exceeded their dispatch SLA window.',
    timestamp: '15m ago',
    read: false,
    path: '/fulfillment',
  },
  {
    id: 'notif-2',
    category: 'inventory',
    title: 'Low Stock Alert: SKU-HOODIE-BLK-M',
    message: 'Only 8 units remain available. Projected stockout date is Nov 4, 2026.',
    timestamp: '42m ago',
    read: false,
    path: '/inventory',
  },
  {
    id: 'notif-3',
    category: 'orders',
    title: 'High-Value Order Received',
    message: 'Order ORD-8842 placed by Sarah Jenkins ($1,250.00). Priority pack assigned.',
    timestamp: '2h ago',
    read: false,
    path: '/orders',
  },
  {
    id: 'notif-4',
    category: 'system',
    title: 'Stripe Payout Reconciled',
    message: 'Daily bank transfer of $14,820.50 reconciled with $0.00 drift.',
    timestamp: '5h ago',
    read: true,
    path: '/finance',
  },
];

let readMap: Record<string, boolean> = {
  'notif-4': true,
};

const markReadSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(token);
  const slug = session?.organizationSlug || 'acme-commerce';

  const notifications: InAppNotification[] = BASE_NOTIFICATIONS.map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp,
    read: readMap[n.id] ?? n.read,
    actionUrl: `/${slug}${n.path}`,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    notifications,
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
      BASE_NOTIFICATIONS.forEach((n) => {
        readMap[n.id] = true;
      });
    } else if (notificationId) {
      readMap[notificationId] = true;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    const slug = session?.organizationSlug || 'acme-commerce';

    const notifications: InAppNotification[] = BASE_NOTIFICATIONS.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: readMap[n.id] ?? n.read,
      actionUrl: `/${slug}${n.path}`,
    }));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update notification state' },
      { status: 500 }
    );
  }
}
