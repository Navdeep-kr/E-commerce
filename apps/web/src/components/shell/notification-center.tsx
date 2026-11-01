'use client';

import React, { useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Package, Clock } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'inventory' | 'payment' | 'task';
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High-Risk Order Auto-Held',
    message: 'Order #ORD-10892 ($420.00) flagged for billing address mismatch.',
    time: '5m ago',
    type: 'order',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Low Stock Alert',
    message: 'SKU "HOODIE-BLK-XL" fell below reorder threshold (3 units left).',
    time: '24m ago',
    type: 'inventory',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'SLA Breach Warning',
    message: 'Ticket #TK-2041 waiting on first response for 3h 45m.',
    time: '1h ago',
    type: 'task',
    unread: true,
  },
  {
    id: 'notif-4',
    title: 'Payment Reconciliation Complete',
    message: 'Stripe payout ($14,250.00) matched with 128 orders with $0 variance.',
    time: '4h ago',
    type: 'payment',
    unread: false,
  },
];

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {notifications.filter((n) => n.unread).length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 transition-colors hover:bg-muted/40 ${
                n.unread ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{n.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
