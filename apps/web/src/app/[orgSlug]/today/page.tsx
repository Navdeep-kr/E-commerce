'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertOctagon,
  Boxes,
  Truck,
  Headphones,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { OnboardingBanner } from '@/components/shell/onboarding-banner';
import { MoneyMath } from '@storefront-ops/core';

export default function TodayDashboardPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?pageSize=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setOrders(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgSlug]);

  const actualOrdersCount = orders.length;
  const actualRevenueMinor = orders.reduce((sum, o) => sum + (o.totalMinor || 0), 0);
  const waitingToPack = orders.filter((o) => ['paid', 'ready_to_pack', 'unfulfilled'].includes(o.status)).length;
  const onHold = orders.filter((o) => ['on_hold', 'fraud_hold'].includes(o.status)).length;

  const displayRevenueMinor =
    actualOrdersCount > 0 ? actualRevenueMinor : orgSlug === 'acme-commerce' ? (period === 'today' ? 1485000 : period === '7d' ? 9845000 : 38450000) : 0;
  const prevRevenueMinor = Math.round(displayRevenueMinor * 0.82);
  const displayOrdersCount =
    actualOrdersCount > 0 ? actualOrdersCount : orgSlug === 'acme-commerce' ? (period === 'today' ? 148 : period === '7d' ? 980 : 3820) : 0;
  const displayAovMinor = displayOrdersCount > 0 ? Math.round(displayRevenueMinor / displayOrdersCount) : 0;

  const actionQueue = [
    {
      id: 'pack-queue',
      title: 'Orders waiting to pack',
      count: actualOrdersCount > 0 ? waitingToPack : orgSlug === 'acme-commerce' ? 12 : 0,
      subtext: waitingToPack > 0 ? `${waitingToPack} orders near carrier cutoff` : 'All orders packed & dispatched',
      href: `/${orgSlug}/fulfillment`,
      badgeColor: 'text-orange-600 bg-white border border-orange-300',
      icon: Truck,
    },
    {
      id: 'hold-queue',
      title: 'Orders on fraud/risk hold',
      count: actualOrdersCount > 0 ? onHold : orgSlug === 'acme-commerce' ? 4 : 0,
      subtext: onHold > 0 ? `${onHold} orders requiring manual review` : '0 risk flags detected',
      href: `/${orgSlug}/orders`,
      badgeColor: 'text-red-600 bg-white border border-red-300',
      icon: AlertOctagon,
    },
    {
      id: 'stock-queue',
      title: 'Low stock alerts',
      count: orgSlug === 'acme-commerce' ? 5 : 0,
      subtext: 'Projected stockout < 4 days',
      href: `/${orgSlug}/inventory`,
      badgeColor: 'text-red-600 bg-white border border-red-300',
      icon: Boxes,
    },
    {
      id: 'support-queue',
      title: 'Tickets near SLA breach',
      count: orgSlug === 'acme-commerce' ? 3 : 0,
      subtext: 'Over 3h since inquiry',
      href: `/${orgSlug}/support`,
      badgeColor: 'text-orange-600 bg-white border border-orange-300',
      icon: Headphones,
    },
  ];

  const recentActivity = orders.length > 0
    ? orders.slice(0, 4).map((o) => ({
        id: o.id,
        title: `Order #${o.orderNumber} placed`,
        sub: `${o.channel || 'Direct Sales'} • $${((o.totalMinor || 0) / 100).toFixed(2)}`,
        time: o.placedAt ? new Date(o.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        status: o.status,
      }))
    : [
        { id: '1', title: 'Order #ORD-10892 placed', sub: 'Shopify US • $185.00', time: '4m ago', status: 'paid' },
        { id: '2', title: 'Batch #B-104 picked', sub: 'Fulfillment Lead (Sam) • 24 items', time: '18m ago', status: 'packing' },
        { id: '3', title: 'Low stock auto-task created', sub: 'Purchasing PO #PO-402 draft', time: '35m ago', status: 'ready_to_pack' },
        { id: '4', title: 'Return #RMA-801 restocked', sub: 'Grade A • Restocked to Bin A-12', time: '1h ago', status: 'returned' },
      ];

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Operations Command</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-300">
              Live Engine Active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Today's Operations Command</h1>
          <p className="text-xs text-zinc-600">
            Real-time attention queue across sales, warehouse, inventory, and support.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 text-xs shadow-xs self-start sm:self-auto gap-1">
          {(['today', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 font-bold transition-colors ${
                period === p
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding Checklist for newly launched and active stores */}
      <OnboardingBanner
        orgSlug={orgSlug}
        orgName={orgSlug === 'acme-commerce' ? 'Acme Commerce Labs' : orgSlug === 'acme-corp' ? 'Acme Corp' : orgSlug.replace(/-/g, ' ').toUpperCase()}
      />

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Net Revenue"
          value={MoneyMath.format({ amount: displayRevenueMinor, currency: 'USD' })}
          previousValue={MoneyMath.format({ amount: prevRevenueMinor, currency: 'USD' })}
          changePercent={19.8}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Processed Orders"
          value={displayOrdersCount.toLocaleString()}
          previousValue={Math.round(displayOrdersCount * 0.85).toLocaleString()}
          changePercent={19.3}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KPICard
          title="Average Order Value"
          value={MoneyMath.format({ amount: displayAovMinor, currency: 'USD' })}
          changePercent={2.4}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Return Rate"
          value="1.4%"
          changePercent={-0.6}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
      </div>

      {/* Priority Action Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-black flex items-center gap-2 uppercase">
            <span>Action Queue (Needs Attention Now)</span>
            <span className="rounded-full bg-white border border-red-300 text-red-600 text-[10px] font-bold px-2 py-0.5">
              24 items
            </span>
          </h2>
          <span className="text-xs text-zinc-500 font-medium">Click card to open filtered view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionQueue.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-black transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-black group-hover:bg-black group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold font-mono ${item.badgeColor}`}>
                    {item.count}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-black group-hover:text-black">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{item.subtext}</p>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-black">
                  <span>Take action</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-Column Section: Operational Feed & Store Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Activity Feed (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Live Operations Stream</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {recentActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-black">{act.title}</p>
                  <p className="text-[11px] text-zinc-500">{act.sub}</p>
                </div>
                <div className="text-right space-y-1">
                  <StatusPill status={act.status as any} />
                  <p className="text-[10px] text-zinc-500 font-medium">{act.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100 flex justify-end">
            <Link
              href={`/${orgSlug}/orders`}
              className="text-xs font-bold text-black hover:underline flex items-center gap-1"
            >
              <span>View all orders &amp; events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right: Quick Operational Links & Warehouse Status (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">Fast Execution Hub</h2>
              <span className="text-[10px] font-mono font-bold text-zinc-500">Sub-5ms Latency</span>
            </div>

            <div className="space-y-2">
              <Link
                href={`/${orgSlug}/fulfillment`}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:border-black bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold text-black">Launch Warehouse Pack Station</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>

              <Link
                href={`/${orgSlug}/orders/new`}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:border-black bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold text-black">Create Manual B2B / Phone Order</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>

              <Link
                href={`/${orgSlug}/returns`}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:border-black bg-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="h-4 w-4 text-black" />
                  <span className="text-xs font-bold text-black">Scan Inbound RMA Return Label</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Next carrier cutoff: 4:00 PM EST</span>
            <span className="font-bold text-black">USPS &amp; UPS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
