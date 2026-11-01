'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  Layers,
  ArrowRight,
  ExternalLink,
  Printer,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  Flame,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { FulfillmentService, type PickItem, type BackorderRecord } from '@storefront-ops/core';

interface SlaOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  itemsCount: number;
  totalMinor: number;
  placedAt: string;
  slaStatus: 'ok' | 'warning' | 'critical' | 'breached';
  hoursRemaining: number;
  deadlineIso: string;
}

interface DeliveryException {
  id: string;
  trackingNumber: string;
  carrier: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  issue: string;
  status: 'exception' | 'delayed' | 'investigating';
  lastUpdated: string;
}

export default function FulfillmentPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'sla' | 'batches' | 'exceptions' | 'backorders'>('sla');
  const [slaFilter, setSlaFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SLA Orders Data
  const [orders, setOrders] = useState<SlaOrder[]>([]);

  // Wave / Batch Picking Data
  const [pickBatch, setPickBatch] = useState<{
    batchId: string;
    zone: string;
    items: (PickItem & { picked?: boolean })[];
  }>({
    batchId: 'BATCH-2026-1101',
    zone: 'Zone A & B (Apparel)',
    items: [
      { sku: 'TEE-WHT-L', variantTitle: 'Tee (White / L)', binLocation: 'B-04-12', quantity: 2, orderNumber: 'ORD-10892', picked: false },
      { sku: 'HOODIE-BLK-M', variantTitle: 'Hoodie (Black / M)', binLocation: 'A-01-05', quantity: 1, orderNumber: 'ORD-10892', picked: true },
      { sku: 'CAP-NAVY-OS', variantTitle: 'Cap (Navy)', binLocation: 'A-01-02', quantity: 1, orderNumber: 'ORD-10893', picked: true },
      { sku: 'HOODIE-BLK-XL', variantTitle: 'Hoodie (Black / XL)', binLocation: 'A-02-16', quantity: 2, orderNumber: 'ORD-10894', picked: false },
      { sku: 'SOCKS-GRY', variantTitle: 'Wool Socks', binLocation: 'C-02-01', quantity: 3, orderNumber: 'ORD-10895', picked: false },
    ],
  });

  // Delivery Exceptions Data
  const [exceptions, setExceptions] = useState<DeliveryException[]>([
    {
      id: 'exc-1',
      trackingNumber: '94001118995648123901',
      carrier: 'USPS',
      orderNumber: 'ORD-10840',
      customerName: 'Sarah Jenkins',
      destination: 'Austin, TX',
      issue: 'Incorrect postal code / Undeliverable as addressed',
      status: 'exception',
      lastUpdated: '12 mins ago',
    },
    {
      id: 'exc-2',
      trackingNumber: '1Z9999999984920192',
      carrier: 'UPS',
      orderNumber: 'ORD-10844',
      customerName: 'Michael Chang',
      destination: 'Chicago, IL',
      issue: 'Severe weather delay at Hodgkins rail terminal',
      status: 'delayed',
      lastUpdated: '45 mins ago',
    },
    {
      id: 'exc-3',
      trackingNumber: '789048190284',
      carrier: 'FedEx',
      orderNumber: 'ORD-10851',
      customerName: 'Elena Rostova',
      destination: 'Denver, CO',
      issue: 'Delivery attempted - Commercial security gate locked',
      status: 'investigating',
      lastUpdated: '2 hours ago',
    },
  ]);

  // Backorders Data
  const [backorders, setBackorders] = useState<BackorderRecord[]>([
    { orderId: 'ord-b1', orderNumber: 'ORD-10810', sku: 'HOODIE-BLK-XL', quantityWaiting: 2, placedAt: '2026-10-28T09:15:00Z' },
    { orderId: 'ord-b2', orderNumber: 'ORD-10822', sku: 'HOODIE-BLK-XL', quantityWaiting: 1, placedAt: '2026-10-29T14:20:00Z' },
    { orderId: 'ord-b3', orderNumber: 'ORD-10855', sku: 'HOODIE-BLK-XL', quantityWaiting: 3, placedAt: '2026-10-31T11:05:00Z' },
    { orderId: 'ord-b4', orderNumber: 'ORD-10860', sku: 'JACKET-DWN-M', quantityWaiting: 1, placedAt: '2026-10-31T16:40:00Z' },
  ]);

  useEffect(() => {
    // Generate orders with calculated SLA countdowns
    const now = new Date();
    const rawOrders = [
      { id: 'ord-10892', orderNumber: 'ORD-10892', customerName: 'Alex Mercer', destination: 'Brooklyn, NY', itemsCount: 3, totalMinor: 14200, placedAt: new Date(now.getTime() - 14 * 3600000).toISOString() },
      { id: 'ord-10893', orderNumber: 'ORD-10893', customerName: 'Brianna Hayes', destination: 'Portland, OR', itemsCount: 1, totalMinor: 3800, placedAt: new Date(now.getTime() - 15 * 3600000).toISOString() },
      { id: 'ord-10894', orderNumber: 'ORD-10894', customerName: 'Carlos Rivera', destination: 'Austin, TX', itemsCount: 4, totalMinor: 21500, placedAt: new Date(now.getTime() - 12 * 3600000).toISOString() },
      { id: 'ord-10895', orderNumber: 'ORD-10895', customerName: 'Diana Prince', destination: 'Chicago, IL', itemsCount: 2, totalMinor: 9400, placedAt: new Date(now.getTime() - 8 * 3600000).toISOString() },
      { id: 'ord-10896', orderNumber: 'ORD-10896', customerName: 'Evan Wright', destination: 'Seattle, WA', itemsCount: 1, totalMinor: 5500, placedAt: new Date(now.getTime() - 4 * 3600000).toISOString() },
      { id: 'ord-10897', orderNumber: 'ORD-10897', customerName: 'Fiona Gallagher', destination: 'Boston, MA', itemsCount: 2, totalMinor: 8900, placedAt: new Date(now.getTime() - 2 * 3600000).toISOString() },
    ];

    const calculated: SlaOrder[] = rawOrders.map((o) => {
      const sla = FulfillmentService.calculateSlaStatus(o.placedAt, now, 16);
      return {
        ...o,
        slaStatus: sla.status,
        hoursRemaining: sla.hoursRemaining,
        deadlineIso: sla.deadlineIso,
      };
    });

    setOrders(calculated);

    // Optimize pick batch path alphabetically
    setPickBatch((prev) => ({
      ...prev,
      items: FulfillmentService.optimizePickPath(prev.items) as (PickItem & { picked?: boolean })[],
    }));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const togglePickedItem = (index: number) => {
    setPickBatch((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], picked: !updated[index].picked };
      return { ...prev, items: updated };
    });
  };

  const handleSimulatePoReceipt = () => {
    const result = FulfillmentService.releaseBackorders(
      { 'HOODIE-BLK-XL': 4 },
      backorders
    );

    const releasedSet = new Set(result.releasedOrderIds);
    setBackorders((prev) => prev.filter((b) => !releasedSet.has(b.orderId)));
    showToast(`FIFO Backorder Release: ${result.releasedOrderIds.length} orders automatically unblocked & routed to picking!`);
  };

  const filteredOrders = orders.filter((o) => {
    if (slaFilter === 'all') return true;
    return o.slaStatus === slaFilter;
  });

  const criticalOrdersCount = orders.filter((o) => o.slaStatus === 'critical' || o.slaStatus === 'breached').length;

  return (
    <div className="space-y-6 bg-white min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white border-2 border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-700 shadow-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-black">Warehouse Operations</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300">
              East Coast DC
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Fulfillment Workspace</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Wave picking path optimization, SLA cutoffs, pack verification, and carrier exceptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/fulfillment/pack-station`}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Barcode className="h-4 w-4" />
            <span>Launch Pack Station</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Orders to Fulfill"
          value="28"
          trend={{ value: 12, isPositive: true }}
          description="In picking & packing queues"
          icon={<Package className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="Critical SLA (< 2h)"
          value={String(criticalOrdersCount)}
          description="Carrier cutoff approaching"
          icon={<Flame className="h-5 w-5 text-red-600" />}
        />
        <KpiCard
          title="Packed Today"
          value="142"
          trend={{ value: 8, isPositive: true }}
          description="Across 3 packing stations"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Delivery Exceptions"
          value={String(exceptions.length)}
          description="Carrier delays & address holds"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('sla')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'sla'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>SLA Countdown Board</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'batches'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Wave & Batch Picking</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            5 items
          </span>
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'exceptions'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span>Carrier Exceptions</span>
          <span className="rounded-full bg-white border border-red-300 px-2 py-0.5 text-xs text-red-600 font-mono font-bold">
            {exceptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('backorders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'backorders'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Backorders (FIFO Queue)</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {backorders.length}
          </span>
        </button>
      </div>

      {/* Tab 1: SLA Countdown Board */}
      {activeTab === 'sla' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black">Filter Urgency:</span>
              <div className="flex items-center gap-1.5">
                {(['all', 'critical', 'warning', 'ok'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSlaFilter(filter)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize transition-colors border ${
                      slaFilter === filter
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:text-black'
                    }`}
                  >
                    {filter === 'all' ? 'All Orders' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-zinc-600 font-medium flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
              <span>Carrier Cutoff: 4:00 PM EST daily</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">SLA Deadline</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 bg-white">
                      <EmptyState
                        icon={Truck}
                        title="All Caught Up! Zero Orders In Queue"
                        description="There are currently no orders waiting in the picking or packing queue. New orders from connected storefronts will automatically route here."
                        primaryAction={{
                          label: 'Launch Pack Station Scanner',
                          href: `/${orgSlug}/fulfillment/pack-station`,
                        }}
                        secondaryAction={{
                          label: 'View Order History',
                          href: `/${orgSlug}/orders`,
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors bg-white">
                      <td className="py-3.5 px-4 font-mono font-bold text-black">
                        <Link href={`/${orgSlug}/orders/${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-black font-semibold">{o.customerName}</td>
                      <td className="py-3.5 px-4 text-zinc-600 text-xs font-medium">{o.destination}</td>
                      <td className="py-3.5 px-4 text-black">{o.itemsCount} units</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-black">
                        ${(o.totalMinor / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-600 font-semibold">
                        {new Date(o.deadlineIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.slaStatus === 'critical' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-600 border border-red-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            Critical ({o.hoursRemaining}h left)
                          </span>
                        ) : o.slaStatus === 'warning' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-orange-600 border border-orange-400">
                            Warning ({o.hoursRemaining}h left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-500">
                            On Track ({o.hoursRemaining}h left)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/${orgSlug}/fulfillment/pack-station?order=${o.orderNumber}`}
                          className="inline-flex items-center gap-1 rounded-md bg-white border border-zinc-300 px-2.5 py-1 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-xs"
                        >
                          <Barcode className="h-3.5 w-3.5 text-black" />
                          Pack Now
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Wave & Batch Picking */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-black">{pickBatch.batchId}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-black border border-zinc-300">
                  {pickBatch.zone}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 font-medium">
                Optimized bin sequence pick path (Zone &rarr; Aisle &rarr; Shelf &rarr; Bin) eliminates aisle backtracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Pick sheet sent to warehouse zebra printer.')}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 text-black" />
                Print Pick Sheet
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-black">Pick Sequence (5 Items)</span>
              <span className="text-xs text-zinc-600 font-medium">
                {pickBatch.items.filter((i) => i.picked).length} of {pickBatch.items.length} items collected
              </span>
            </div>
            <div className="divide-y divide-zinc-200 bg-white">
              {pickBatch.items.map((item, idx) => (
                <div
                  key={`${item.sku}-${idx}`}
                  onClick={() => togglePickedItem(idx)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors bg-white ${
                    item.picked ? 'opacity-60 bg-zinc-50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.picked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-orange-600 border border-orange-400">
                          {item.binLocation}
                        </span>
                        <span className="font-bold text-sm text-black">{item.variantTitle}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600 font-medium">
                        <span className="font-mono">{item.sku}</span>
                        <span>&bull;</span>
                        <span>For {item.orderNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-black">x{item.quantity}</span>
                    <p className="text-[11px] text-zinc-500 font-medium">Pick qty</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Carrier Exceptions */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-white px-4 py-3 border-b border-zinc-200">
              <h3 className="text-sm font-bold text-black">Active Delivery Exceptions & Delays</h3>
              <p className="text-xs text-zinc-600 font-medium">
                Shipments requiring intervention, carrier inquiries, or recipient address verification.
              </p>
            </div>
            <div className="divide-y divide-zinc-200 bg-white">
              {exceptions.map((exc) => (
                <div key={exc.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white border border-red-400 px-2 py-0.5 text-xs font-bold text-red-600">
                        {exc.carrier}
                      </span>
                      <span className="font-mono text-xs font-bold text-black">{exc.trackingNumber}</span>
                      <span className="text-xs text-zinc-500 font-medium">&bull; {exc.lastUpdated}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {exc.issue}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 font-medium">
                      <span>Order: {exc.orderNumber}</span>
                      <span>&bull;</span>
                      <span>Recipient: {exc.customerName} ({exc.destination})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Reroute request filed with ${exc.carrier}.`)}
                      className="rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-xs"
                    >
                      Resolve Exception
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Backorder FIFO Queue */}
      {activeTab === 'backorders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm gap-4">
            <div>
              <h3 className="text-sm font-bold text-black">FIFO Backorder Release Engine</h3>
              <p className="text-xs text-zinc-600 font-medium">
                When incoming PO stock is received, the system releases pending orders in strict FIFO order (oldest first).
              </p>
            </div>

            <button
              onClick={handleSimulatePoReceipt}
              className="flex items-center gap-2 rounded-lg bg-black px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Simulate PO Stock Receipt (4x HOODIE-BLK-XL)
            </button>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">FIFO Rank</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Waiting SKU</th>
                  <th className="py-3 px-4">Quantity Waiting</th>
                  <th className="py-3 px-4">Order Placed Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {backorders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm font-semibold bg-white">
                      No orders currently blocked on backorders!
                    </td>
                  </tr>
                ) : (
                  backorders.map((bo, index) => (
                    <tr key={bo.orderId} className="hover:bg-zinc-50 transition-colors bg-white">
                      <td className="py-3 px-4 font-mono font-bold text-orange-600">#{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-black">{bo.orderNumber}</td>
                      <td className="py-3 px-4 font-mono text-black">{bo.sku}</td>
                      <td className="py-3 px-4 text-black font-semibold">{bo.quantityWaiting} units</td>
                      <td className="py-3 px-4 text-xs font-mono text-zinc-600 font-semibold">
                        {new Date(bo.placedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-orange-600 border border-orange-400">
                          Waiting Stock
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
