'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Headphones,
  DollarSign,
  Clock,
  ExternalLink,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerProfile360Page() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';
  const customerId = (params?.id as string) || 'cust-101';

  const [customer, setCustomer] = useState({
    id: customerId,
    name: 'Alex Mercer',
    email: 'alex.mercer@example.com',
    phone: '+1 212-555-0143',
    segment: 'Champions',
    rfmScores: { r: 5, f: 5, m: 5 },
    totalSpentMinor: 168000,
    ordersCount: 14,
    avgOrderValueMinor: 12000,
    daysSinceLastOrder: 4,
    tags: ['vip', 'early-adopter', 'high-ltv'],
    addresses: [
      {
        id: 'addr-1',
        street1: '142 Grand Street, Apt 4B',
        city: 'Brooklyn',
        state: 'NY',
        zip: '11249',
        country: 'US',
        isDefault: true,
      },
    ],
    orders: [
      { id: 'ord-10892', number: 'ORD-10892', date: 'October 28, 2026', totalMinor: 14200, status: 'shipped', itemsCount: 3 },
      { id: 'ord-10842', number: 'ORD-10842', date: 'October 12, 2026', totalMinor: 8500, status: 'delivered', itemsCount: 1 },
      { id: 'ord-10790', number: 'ORD-10790', date: 'September 24, 2026', totalMinor: 21500, status: 'delivered', itemsCount: 4 },
    ],
    returns: [
      { id: 'ret-1001', rmaNumber: 'RMA-90812', orderNumber: 'ORD-10842', sku: 'HOODIE-BLK-M', refundMinor: 8500, status: 'received' },
    ],
    tickets: [
      { id: 'tkt-401', number: 'TICK-1049', subject: 'Where is my order? Need delivery confirmation', priority: 'high', status: 'open' },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/customers`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">{customer.id}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                {customer.segment}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{customer.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/support?customer=${customer.email}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Open Support Ticket</span>
          </Link>
          <Link
            href={`/${orgSlug}/orders/new?customer=${customer.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Info & Addresses (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Customer Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Phone className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>Customer since Feb 2025</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-400">RFM Scores</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Recency</p>
                  <p className="text-base font-bold text-emerald-400">{customer.rfmScores.r}/5</p>
                </div>
                <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Frequency</p>
                  <p className="text-base font-bold text-emerald-400">{customer.rfmScores.f}/5</p>
                </div>
                <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase">Monetary</p>
                  <p className="text-base font-bold text-emerald-400">{customer.rfmScores.m}/5</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <span className="text-xs font-semibold text-zinc-400">Customer Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((t) => (
                  <span key={t} className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-400">Shipping Addresses</span>
              {customer.addresses.map((addr) => (
                <div key={addr.id} className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 mb-1">
                    <span className="font-semibold text-zinc-300">Default Address</span>
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <p className="text-zinc-200">{addr.street1}</p>
                  <p className="text-zinc-400">{addr.city}, {addr.state} {addr.zip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LTV Metrics & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* LTV KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-400">Total Lifetime Value</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ${(customer.totalSpentMinor / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Top 1% of storefront spenders</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-400">Total Orders</p>
              <p className="text-2xl font-black font-mono text-indigo-400 mt-1">{customer.ordersCount}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Last ordered 4 days ago</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs font-semibold uppercase text-zinc-400">Average Order Value</p>
              <p className="text-2xl font-black font-mono text-zinc-100 mt-1">
                ${(customer.avgOrderValueMinor / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Consistent apparel purchaser</p>
            </div>
          </div>

          {/* Order History Timeline */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200">Order History ({customer.orders.length})</h3>
              <span className="text-xs text-zinc-500">Sorted by newest</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {customer.orders.map((ord) => (
                <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${orgSlug}/orders/${ord.id}`}
                        className="font-mono font-bold text-sm text-indigo-400 hover:underline"
                      >
                        {ord.number}
                      </Link>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase font-bold text-zinc-300">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {ord.date} &bull; {ord.itemsCount} line items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-zinc-100">
                      ${(ord.totalMinor / 100).toFixed(2)}
                    </p>
                    <Link
                      href={`/${orgSlug}/orders/${ord.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-0.5 mt-0.5"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returns & Support Tickets Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Returns */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase">Returns</span>
                <span className="text-xs text-zinc-500">{customer.returns.length} records</span>
              </div>
              <div className="p-3 divide-y divide-zinc-800/60">
                {customer.returns.map((ret) => (
                  <div key={ret.id} className="py-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-rose-400">{ret.rmaNumber}</span>
                      <span className="font-mono text-zinc-200">${(ret.refundMinor / 100).toFixed(2)}</span>
                    </div>
                    <p className="text-zinc-400 mt-0.5">{ret.sku} (Order {ret.orderNumber})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Tickets */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase">Support Tickets</span>
                <span className="text-xs text-zinc-500">{customer.tickets.length} open</span>
              </div>
              <div className="p-3 divide-y divide-zinc-800/60">
                {customer.tickets.map((tkt) => (
                  <div key={tkt.id} className="py-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-indigo-400">{tkt.number}</span>
                      <span className="rounded bg-rose-500/10 text-rose-400 px-1.5 py-0.2 text-[10px] font-bold">
                        {tkt.priority}
                      </span>
                    </div>
                    <p className="text-zinc-300 mt-0.5 truncate">{tkt.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
