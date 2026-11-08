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
    fulfillment: <Truck className="h-4 w-4 text-orange-600" />,
    inventory: <Package className="h-4 w-4 text-red-600" />,
    orders: <ShoppingCart className="h-4 w-4 text-black" />,
    system: <ShieldCheck className="h-4 w-4 text-green-700" />,
  };

  return (
    <div className="w-full space-y-6 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white shadow-xs">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Real-time operations alerts, warehouse fulfillment notifications, and customer communications.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="px-3.5 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 text-xs font-bold text-black flex items-center gap-1.5 transition shadow-xs"
        >
          <CheckCheck className="h-4 w-4 text-green-600" /> Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        {(['all', 'fulfillment', 'inventory', 'orders', 'system'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition shadow-xs ${
              filter === tab
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:text-black'
            }`}
          >
            {tab === 'all' ? 'All Alerts' : tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border border-zinc-200 rounded-2xl bg-white text-zinc-500 text-sm shadow-xs">
            No notifications in this category.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition shadow-sm flex items-start justify-between gap-4 bg-white ${
                item.read
                  ? 'border-zinc-200 opacity-80'
                  : 'border-2 border-orange-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-zinc-200 mt-0.5 shadow-xs">
                  {categoryIcons[item.category]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-black">{item.title}</h3>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed font-normal">
                    {item.message}
                  </p>
                  <span className="text-[11px] text-zinc-500 mt-2 block font-medium">{item.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.read && (
                  <button
                    onClick={() => handleMarkOne(item.id)}
                    className="text-[11px] text-zinc-600 hover:text-black font-bold px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 transition shadow-xs"
                  >
                    Mark read
                  </button>
                )}
                {item.actionUrl && (
                  <a
                    href={item.actionUrl}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-black border border-zinc-200 hover:bg-zinc-100 transition shadow-xs"
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 mt-8">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-black" /> Order Communications Timeline (Live Sync Preview)
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Every dispatched customer notification (Email, SMS) automatically logs directly to the order audit timeline.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-white border border-zinc-300 text-black px-2.5 py-1 rounded shadow-xs">
            Target: ORD-5501
          </span>
        </div>

        <div className="space-y-4 pl-4 border-l-2 border-zinc-300 ml-2">
          {/* Item 1 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-green-600 border-2 border-white" />
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <Mail className="h-3.5 w-3.5 text-black" /> Sent Order Shipped via EMAIL
              <span className="text-[10px] text-zinc-500 font-medium">10:14 AM</span>
            </div>
            <p className="text-xs text-zinc-600">
              Tracking link sent to sarah.j@example.com (UPS: 1Z999AA10123456784)
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono text-black font-semibold bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-xs">
                https://track.storefrontops.com/UPS/1Z999AA10123456784
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-green-600 border-2 border-white" />
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <Smartphone className="h-3.5 w-3.5 text-black" /> Sent Out for Delivery via SMS
              <span className="text-[10px] text-zinc-500 font-medium">08:30 AM</span>
            </div>
            <p className="text-xs text-zinc-600">
              SMS dispatch to +14155552671: &quot;Your package ORD-5501 is out for delivery today with UPS!&quot;
            </p>
          </div>

          {/* Item 3 */}
          <div className="relative space-y-1">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-black border-2 border-white" />
            <div className="flex items-center gap-2 text-xs font-bold text-black">
              <Mail className="h-3.5 w-3.5 text-black" /> Sent Order Confirmed via EMAIL
              <span className="text-[10px] text-zinc-500 font-medium">Yesterday</span>
            </div>
            <p className="text-xs text-zinc-600">
              Order confirmation recap dispatched to customer with total of $125.00.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
