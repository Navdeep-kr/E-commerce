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
    <div className="space-y-6 bg-white min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 gap-4 bg-white">
        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/customers`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-black hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-600 font-semibold">{customer.id}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-500">
                {customer.segment}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-black">{customer.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/support?customer=${customer.email}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <Headphones className="h-3.5 w-3.5 text-black" />
            <span>Open Support Ticket</span>
          </Link>
          <Link
            href={`/${orgSlug}/orders/new?customer=${customer.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
        {/* Left Column: Customer Info & Addresses (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">Customer Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-black">
                <Mail className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="font-medium">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-black">
                <Phone className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="font-medium">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600">
                <Calendar className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>Customer since Feb 2025</span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 space-y-2">
              <span className="text-xs font-bold text-black">RFM Scores</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2 border border-zinc-300">
                  <p className="text-[10px] text-zinc-600 font-semibold uppercase">Recency</p>
                  <p className="text-base font-bold text-emerald-600">{customer.rfmScores.r}/5</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-zinc-300">
                  <p className="text-[10px] text-zinc-600 font-semibold uppercase">Frequency</p>
                  <p className="text-base font-bold text-emerald-600">{customer.rfmScores.f}/5</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-zinc-300">
                  <p className="text-[10px] text-zinc-600 font-semibold uppercase">Monetary</p>
                  <p className="text-base font-bold text-emerald-600">{customer.rfmScores.m}/5</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 space-y-1.5">
              <span className="text-xs font-bold text-black">Customer Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {customer.tags.map((t) => (
                  <span key={t} className="rounded-md bg-white px-2 py-0.5 text-xs font-mono font-semibold text-black border border-zinc-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-200 space-y-2">
              <span className="text-xs font-bold text-black">Shipping Addresses</span>
              {customer.addresses.map((addr) => (
                <div key={addr.id} className="rounded-lg bg-white p-3 border border-zinc-200 text-xs shadow-xs">
                  <div className="flex items-center justify-between text-zinc-600 mb-1">
                    <span className="font-bold text-black">Default Address</span>
                    <MapPin className="h-3.5 w-3.5 text-black" />
                  </div>
                  <p className="text-black font-medium">{addr.street1}</p>
                  <p className="text-zinc-600">{addr.city}, {addr.state} {addr.zip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LTV Metrics & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* LTV KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-zinc-600">Total Lifetime Value</p>
              <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                ${(customer.totalSpentMinor / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Top 1% of storefront spenders</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-zinc-600">Total Orders</p>
              <p className="text-2xl font-black font-mono text-black mt-1">{customer.ordersCount}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Last ordered 4 days ago</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase text-zinc-600">Average Order Value</p>
              <p className="text-2xl font-black font-mono text-black mt-1">
                ${(customer.avgOrderValueMinor / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Consistent apparel purchaser</p>
            </div>
          </div>

          {/* Order History Timeline */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-white border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-black">Order History ({customer.orders.length})</h3>
              <span className="text-xs text-zinc-500 font-medium">Sorted by newest</span>
            </div>
            <div className="divide-y divide-zinc-200 bg-white">
              {customer.orders.map((ord) => (
                <div key={ord.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors bg-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${orgSlug}/orders/${ord.id}`}
                        className="font-mono font-bold text-sm text-black hover:underline"
                      >
                        {ord.number}
                      </Link>
                      <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-[10px] uppercase font-bold text-black">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">
                      {ord.date} &bull; {ord.itemsCount} line items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-black">
                      ${(ord.totalMinor / 100).toFixed(2)}
                    </p>
                    <Link
                      href={`/${orgSlug}/orders/${ord.id}`}
                      className="text-xs text-zinc-600 hover:text-black font-semibold inline-flex items-center gap-0.5 mt-0.5"
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
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-white border-b border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-bold text-black uppercase">Returns</span>
                <span className="text-xs text-zinc-500 font-medium">{customer.returns.length} records</span>
              </div>
              <div className="p-3 divide-y divide-zinc-200 bg-white">
                {customer.returns.map((ret) => (
                  <div key={ret.id} className="py-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-rose-600">{ret.rmaNumber}</span>
                      <span className="font-mono font-bold text-black">${(ret.refundMinor / 100).toFixed(2)}</span>
                    </div>
                    <p className="text-zinc-600 mt-0.5">{ret.sku} (Order {ret.orderNumber})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Tickets */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-white border-b border-zinc-200 flex items-center justify-between">
                <span className="text-xs font-bold text-black uppercase">Support Tickets</span>
                <span className="text-xs text-zinc-500 font-medium">{customer.tickets.length} open</span>
              </div>
              <div className="p-3 divide-y divide-zinc-200 bg-white">
                {customer.tickets.map((tkt) => (
                  <div key={tkt.id} className="py-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-black">{tkt.number}</span>
                      <span className="rounded bg-white border border-rose-300 text-rose-600 px-1.5 py-0.2 text-[10px] font-bold">
                        {tkt.priority}
                      </span>
                    </div>
                    <p className="text-zinc-600 mt-0.5 truncate">{tkt.subject}</p>
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
