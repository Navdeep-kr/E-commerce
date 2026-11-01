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
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { DataTable, type Column } from '@/components/ui/data-table';
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
    // Receive 4 units of HOODIE-BLK-XL
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-zinc-900 border border-emerald-500/50 px-4 py-3 text-sm text-emerald-400 shadow-xl shadow-black/40">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Warehouse Operations</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
              East Coast DC
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Fulfillment Workspace</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Wave picking path optimization, SLA cutoffs, pack verification, and carrier exceptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/fulfillment/pack-station`}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition-colors"
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
          icon={<Package className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Critical SLA (< 2h)"
          value={String(criticalOrdersCount)}
          description="Carrier cutoff approaching"
          icon={<Flame className="h-5 w-5 text-rose-400" />}
        />
        <KpiCard
          title="Packed Today"
          value="142"
          trend={{ value: 8, isPositive: true }}
          description="Across 3 packing stations"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Delivery Exceptions"
          value={String(exceptions.length)}
          description="Carrier delays & address holds"
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('sla')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'sla'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>SLA Countdown Board</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{orders.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'batches'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Wave & Batch Picking</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">5 items</span>
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'exceptions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Carrier Exceptions</span>
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{exceptions.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('backorders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'backorders'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Backorders (FIFO Queue)</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{backorders.length}</span>
        </button>
      </div>

      {/* Tab 1: SLA Countdown Board */}
      {activeTab === 'sla' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Filter Urgency:</span>
              <div className="flex items-center gap-1.5">
                {(['all', 'critical', 'warning', 'ok'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSlaFilter(filter)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      slaFilter === filter
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                  >
                    {filter === 'all' ? 'All Orders' : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Carrier Cutoff: 4:00 PM EST daily</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                      <Link href={`/${orgSlug}/orders/${o.id}`} className="hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-200">{o.customerName}</td>
                    <td className="py-3.5 px-4 text-zinc-400 text-xs">{o.destination}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{o.itemsCount} units</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200">
                      ${(o.totalMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">
                      {new Date(o.deadlineIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      {o.slaStatus === 'critical' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                          Critical ({o.hoursRemaining}h left)
                        </span>
                      ) : o.slaStatus === 'warning' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                          Warning ({o.hoursRemaining}h left)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          On Track ({o.hoursRemaining}h left)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/${orgSlug}/fulfillment/pack-station?order=${o.orderNumber}`}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <Barcode className="h-3.5 w-3.5" />
                        Pack Now
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Wave & Batch Picking */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100">{pickBatch.batchId}</h3>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                  {pickBatch.zone}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Optimized bin sequence pick path (Zone &rarr; Aisle &rarr; Shelf &rarr; Bin) eliminates aisle backtracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Pick sheet sent to warehouse zebra printer.')}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Pick Sheet
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="bg-zinc-950/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-400">Pick Sequence (5 Items)</span>
              <span className="text-xs text-zinc-400">
                {pickBatch.items.filter((i) => i.picked).length} of {pickBatch.items.length} items collected
              </span>
            </div>
            <div className="divide-y divide-zinc-800">
              {pickBatch.items.map((item, idx) => (
                <div
                  key={`${item.sku}-${idx}`}
                  onClick={() => togglePickedItem(idx)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    item.picked ? 'bg-zinc-900/40 opacity-60' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.picked}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {item.binLocation}
                        </span>
                        <span className="font-semibold text-sm text-zinc-200">{item.variantTitle}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span className="font-mono">{item.sku}</span>
                        <span>&bull;</span>
                        <span>For {item.orderNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-zinc-100">x{item.quantity}</span>
                    <p className="text-[11px] text-zinc-500">Pick qty</p>
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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="bg-zinc-950/50 px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-200">Active Delivery Exceptions & Delays</h3>
              <p className="text-xs text-zinc-400">
                Shipments requiring intervention, carrier inquiries, or recipient address verification.
              </p>
            </div>
            <div className="divide-y divide-zinc-800">
              {exceptions.map((exc) => (
                <div key={exc.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                        {exc.carrier}
                      </span>
                      <span className="font-mono text-xs text-zinc-300">{exc.trackingNumber}</span>
                      <span className="text-xs text-zinc-500">&bull; {exc.lastUpdated}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {exc.issue}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span>Order: {exc.orderNumber}</span>
                      <span>&bull;</span>
                      <span>Recipient: {exc.customerName} ({exc.destination})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Reroute request filed with ${exc.carrier}.`)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-zinc-900 p-4 rounded-xl border border-zinc-800 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">FIFO Backorder Release Engine</h3>
              <p className="text-xs text-zinc-400">
                When incoming PO stock is received, the system releases pending orders in strict FIFO order (oldest first).
              </p>
            </div>

            <button
              onClick={handleSimulatePoReceipt}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Simulate PO Stock Receipt (4x HOODIE-BLK-XL)
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">FIFO Rank</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Waiting SKU</th>
                  <th className="py-3 px-4">Quantity Waiting</th>
                  <th className="py-3 px-4">Order Placed Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {backorders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">
                      No orders currently blocked on backorders!
                    </td>
                  </tr>
                ) : (
                  backorders.map((bo, index) => (
                    <tr key={bo.orderId} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">#{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{bo.orderNumber}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{bo.sku}</td>
                      <td className="py-3 px-4 text-zinc-200">{bo.quantityWaiting} units</td>
                      <td className="py-3 px-4 text-xs font-mono text-zinc-400">
                        {new Date(bo.placedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
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
