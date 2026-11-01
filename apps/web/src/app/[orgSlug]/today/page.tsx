'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { MoneyMath } from '@storefront-ops/core';

export default function TodayDashboardPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('today');

  // Realistic sample financial calculations using MoneyMath
  const revenueMinor = period === 'today' ? 1485000 : period === '7d' ? 9845000 : 38450000;
  const prevRevenueMinor = period === 'today' ? 1240000 : period === '7d' ? 8900000 : 34100000;
  const aovMinor = Math.round(revenueMinor / (period === 'today' ? 148 : period === '7d' ? 980 : 3820));

  const actionQueue = [
    {
      id: 'pack-queue',
      title: 'Orders waiting to pack',
      count: 12,
      subtext: '4 orders near carrier cutoff',
      href: `/${orgSlug}/fulfillment`,
      variant: 'warning',
      icon: Truck,
    },
    {
      id: 'hold-queue',
      title: 'Orders on fraud/risk hold',
      count: 4,
      subtext: 'Billing address mismatch',
      href: `/${orgSlug}/orders?filter=on_hold`,
      variant: 'danger',
      icon: AlertOctagon,
    },
    {
      id: 'stock-queue',
      title: 'Low stock alerts',
      count: 5,
      subtext: 'Projected stockout < 4 days',
      href: `/${orgSlug}/inventory?filter=low_stock`,
      variant: 'danger',
      icon: Boxes,
    },
    {
      id: 'support-queue',
      title: 'Tickets near SLA breach',
      count: 3,
      subtext: 'Over 3h since inquiry',
      href: `/${orgSlug}/support?filter=sla_breaching`,
      variant: 'warning',
      icon: Headphones,
    },
  ];

  const recentActivity = [
    { id: '1', title: 'Order #ORD-10892 placed', sub: 'Shopify US • $185.00', time: '4m ago', status: 'paid' },
    { id: '2', title: 'Batch #B-104 picked', sub: 'Fulfillment Lead (Sam) • 24 items', time: '18m ago', status: 'packing' },
    { id: '3', title: 'Low stock auto-task created', sub: 'Purchasing PO #PO-402 draft', time: '35m ago', status: 'ready_to_pack' },
    { id: '4', title: 'Return #RMA-801 restocked', sub: 'Grade A • Restocked to Bin A-12', time: '1h ago', status: 'returned' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Today's Operations Command</h1>
          <p className="text-xs text-muted-foreground">
            What needs attention across sales, warehouse, inventory, and support today.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs shadow-sm self-start sm:self-auto">
          {(['today', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Net Revenue"
          value={MoneyMath.format({ amount: revenueMinor, currency: 'USD' })}
          previousValue={MoneyMath.format({ amount: prevRevenueMinor, currency: 'USD' })}
          changePercent={19.8}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Processed Orders"
          value={period === 'today' ? '148' : period === '7d' ? '980' : '3,820'}
          previousValue={period === 'today' ? '124' : period === '7d' ? '895' : '3,410'}
          changePercent={19.3}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <KPICard
          title="Average Order Value"
          value={MoneyMath.format({ amount: aovMinor, currency: 'USD' })}
          changePercent={2.4}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Return Rate"
          value="1.4%"
          changePercent={-0.6}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      {/* Priority Action Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>Action Queue (Needs Attention Now)</span>
            <span className="rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2 py-0.5">
              24 items
            </span>
          </h2>
          <span className="text-xs text-muted-foreground">Click card to open filtered view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionQueue.map((item) => {
            const IconC = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <IconC className="h-4 w-4 group-hover:text-primary transition-colors" />
                    <span
                      className={`text-lg font-bold font-mono ${
                        item.variant === 'danger' ? 'text-rose-500' : 'text-amber-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.subtext}</p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-primary">
                  <span>Take action</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Lower Dashboard Grid: Activity Stream & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Real-Time Activity Feed */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Streaming Event Log</span>
            </h3>
            <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Active
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center justify-between py-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-medium text-foreground">{act.title}</div>
                  <div className="text-[11px] text-muted-foreground">{act.sub}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={act.status} />
                  <span className="text-[11px] text-muted-foreground font-mono">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Breakdown Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Sales by Channel
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-foreground pb-1">
                <span>Shopify Direct Store</span>
                <span className="font-mono">72%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '72%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-foreground pb-1">
                <span>WooCommerce UK</span>
                <span className="font-mono">21%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '21%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-foreground pb-1">
                <span>Direct Manual / Wholesale</span>
                <span className="font-mono">7%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
