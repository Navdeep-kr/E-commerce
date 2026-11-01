'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Package,
  AlertTriangle,
  ShoppingCart,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Mail,
  Smartphone,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'orders' | 'inventory' | 'fulfillment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const routeParams = useParams();
  const orgSlug = (routeParams?.orgSlug as string) || 'acme-commerce';
  const [filter, setFilter] = useState<'all' | 'fulfillment' | 'inventory' | 'orders' | 'system'>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      category: 'fulfillment',
      title: 'Fulfillment SLA Breach',
      message: '3 orders in Main Warehouse have exceeded their dispatch SLA window.',
      timestamp: '15m ago',
      read: false,
      actionUrl: `/${orgSlug}/fulfillment`,
    },
    {
      id: 'notif-2',
      category: 'inventory',
      title: 'Low Stock Alert: SKU-HOODIE-BLK-M',
      message: 'Only 8 units remain available. Projected stockout date is Nov 4, 2026.',
      timestamp: '42m ago',
      read: false,
      actionUrl: `/${orgSlug}/inventory`,
    },
    {
      id: 'notif-3',
      category: 'orders',
      title: 'High-Value Order Received',
      message: 'Order ORD-8842 placed by Sarah Jenkins ($1,250.00). Priority pack assigned.',
      timestamp: '2h ago',
      read: false,
      actionUrl: `/${orgSlug}/orders`,
    },
    {
      id: 'notif-4',
      category: 'system',
      title: 'Stripe Payout Reconciled',
      message: 'Daily bank transfer of $14,820.50 reconciled with $0.00 drift.',
      timestamp: '5h ago',
      read: true,
      actionUrl: `/${orgSlug}/finance`,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      // Local state is already updated
    }
  };

  const handleMarkOne = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch {
      // Local state is already updated
    }
  };

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.category === filter);

  const categoryIcons = {
    fulfillment: <Truck className="h-4 w-4 text-amber-600" />,
    inventory: <Package className="h-4 w-4 text-rose-600" />,
    orders: <ShoppingCart className="h-4 w-4 text-indigo-600" />,
    system: <ShieldCheck className="h-4 w-4 text-emerald-600" />,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500 text-white shadow">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time operations alerts, warehouse fulfillment notifications, and customer communications.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <CheckCheck className="h-4 w-4 text-emerald-600" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {(['all', 'fulfillment', 'inventory', 'orders', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab === 'all' ? 'All Alerts' : tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border rounded-2xl bg-white dark:bg-gray-900 text-gray-400 text-sm">
            No notifications in this category.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition shadow-sm flex items-start justify-between gap-4 ${
                item.read
                  ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-80'
                  : 'bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 ring-1 ring-indigo-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 mt-0.5">
                  {categoryIcons[item.category]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.title}</h3>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-gray-400 mt-2 block">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.read && (
                  <button
                    onClick={() => handleMarkOne(item.id)}
                    className="text-[11px] text-gray-500 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    Mark read
                  </button>
                )}
                {item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Communications Timeline Live Preview Box */}
      <div className="bg-white dark:bg-gray-900 border rounded-2xl p-6 shadow-sm space-y-4 mt-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" /> Order Communications Timeline (Live Sync Preview)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Every dispatched customer notification (Email, SMS) automatically logs directly to the order audit timeline.
            </p>
          </div>
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded">
            Target: ORD-5501
          </span>
        </div>

        <div className="space-y-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900 ml-2">
          {/* Item 1 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
              <Mail className="h-3.5 w-3.5 text-indigo-600" /> Sent Order Shipped via EMAIL
              <span className="text-[10px] text-gray-400">10:14 AM</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Tracking link sent to sarah.j@example.com (UPS: 1Z999AA10123456784)
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                https://track.storefrontops.com/UPS/1Z999AA10123456784
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
              <Smartphone className="h-3.5 w-3.5 text-indigo-600" /> Sent Out for Delivery via SMS
              <span className="text-[10px] text-gray-400">08:30 AM</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              SMS dispatch to +14155552671: &quot;Your package ORD-5501 is out for delivery today with UPS!&quot;
            </p>
          </div>

          {/* Item 3 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900" />
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
              <Mail className="h-3.5 w-3.5 text-indigo-600" /> Sent Order Confirmed via EMAIL
              <span className="text-[10px] text-gray-400">Yesterday</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Order confirmation recap dispatched to customer with total of $125.00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
