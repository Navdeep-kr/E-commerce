'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  PackageCheck,
  Percent,
} from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  PurchasingService,
  type ReorderItemInput,
  type ReorderRecommendation,
  type PoLineItem,
} from '@storefront-ops/core';

export default function PurchasingPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'pos' | 'reorder' | 'suppliers'>('pos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // POs Data
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([
    {
      id: 'po-101',
      poNumber: 'PO-2026-089',
      supplierName: 'Pacific Mills & Textiles',
      supplierCode: 'PAC-MILLS',
      status: 'confirmed',
      orderDate: '2026-10-24',
      expectedDelivery: 'Nov 07, 2026',
      itemsCount: 200,
      totalGoodsMinor: 480000,
      freightCostMinor: 35000,
      customsDutiesMinor: 12500,
      totalLandedCostMinor: 527500,
      lines: [
        { sku: 'HOODIE-BLK-M', qty: 100, unitCost: 2400 },
        { sku: 'HOODIE-BLK-XL', qty: 100, unitCost: 2400 },
      ],
    },
    {
      id: 'po-102',
      poNumber: 'PO-2026-090',
      supplierName: 'Atlas Garment Manufacturing',
      supplierCode: 'ATLAS-GARMENT',
      status: 'sent',
      orderDate: '2026-10-28',
      expectedDelivery: 'Nov 18, 2026',
      itemsCount: 500,
      totalGoodsMinor: 400000,
      freightCostMinor: 28000,
      customsDutiesMinor: 0,
      totalLandedCostMinor: 428000,
      lines: [{ sku: 'TEE-WHT-L', qty: 500, unitCost: 800 }],
    },
  ]);

  // Reorder Queue Data
  const [reorderRecommendations, setReorderRecommendations] = useState<ReorderRecommendation[]>([]);

  // Suppliers Data
  const [suppliers, setSuppliers] = useState<any[]>([
    {
      id: 'sup-1',
      name: 'Pacific Mills & Textiles',
      code: 'PAC-MILLS',
      contact: 'David Chen (dchen@pacificmills.example.com)',
      leadTimeDays: 14,
      moq: 100,
      paymentTerms: 'Net 30',
      onTimeDelivery: 98.4,
      qualityPassRate: 99.2,
      activeSpendMinor: 48500000,
    },
    {
      id: 'sup-2',
      name: 'Atlas Garment Manufacturing',
      code: 'ATLAS-GARMENT',
      contact: 'Elena Rostova (elena@atlasgarment.example.com)',
      leadTimeDays: 21,
      moq: 250,
      paymentTerms: 'Net 45',
      onTimeDelivery: 94.1,
      qualityPassRate: 97.8,
      activeSpendMinor: 32000000,
    },
    {
      id: 'sup-3',
      name: 'Summit Headwear & Accessories',
      code: 'SUMMIT-CAPS',
      contact: 'Marcus Wright (mwright@summitaccessories.example.com)',
      leadTimeDays: 10,
      moq: 50,
      paymentTerms: 'Net 15',
      onTimeDelivery: 99.5,
      qualityPassRate: 99.8,
      activeSpendMinor: 14500000,
    },
  ]);

  useEffect(() => {
    // Generate reorder recommendations via core engine
    const stockItems: ReorderItemInput[] = [
      {
        sku: 'HOODIE-BLK-XL',
        title: 'Heavyweight Fleece Hoodie (Black / XL)',
        availableStock: 2,
        incomingStock: 100, // On PO-2026-089
        dailyVelocity: 4,
        leadTimeDays: 14,
        safetyStockDays: 7,
        supplierMoq: 100,
        unitCostMinor: 2400,
      },
      {
        sku: 'CAP-NAVY-OS',
        title: 'Signature Logo Cap (Navy / OS)',
        availableStock: 4,
        incomingStock: 0,
        dailyVelocity: 3,
        leadTimeDays: 10,
        safetyStockDays: 5,
        supplierMoq: 50,
        unitCostMinor: 1000,
      },
      {
        sku: 'JACKET-DWN-M',
        title: 'Down Puffer Jacket (Charcoal / M)',
        availableStock: 12,
        incomingStock: 0,
        dailyVelocity: 1.5,
        leadTimeDays: 21,
        safetyStockDays: 7,
        supplierMoq: 40,
        unitCostMinor: 7500,
      },
    ];

    const recs = PurchasingService.calculateReorderRecommendations(stockItems);
    setReorderRecommendations(recs);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateDraftPoFromReorder = (rec: ReorderRecommendation) => {
    const newPo = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: 'Pacific Mills & Textiles',
      supplierCode: 'PAC-MILLS',
      status: 'draft',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: 'In 14 days',
      itemsCount: rec.reorderQuantity,
      totalGoodsMinor: rec.estimatedCostMinor,
      freightCostMinor: 15000,
      customsDutiesMinor: 0,
      totalLandedCostMinor: rec.estimatedCostMinor + 15000,
      lines: [{ sku: rec.sku, qty: rec.reorderQuantity, unitCost: rec.estimatedCostMinor / rec.reorderQuantity }],
    };

    setPurchaseOrders((prev) => [newPo, ...prev]);
    setActiveTab('pos');
    showToast(`Draft ${newPo.poNumber} created for ${rec.reorderQuantity} units of ${rec.sku}!`);
  };

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
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Procurement & Supply Chain</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
              Landed Cost Allocation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Purchasing & Suppliers</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Purchase orders lifecycle, landed cost freight allocation, supplier scorecards, and velocity reorder queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('reorder')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 hover:bg-indigo-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Review Reorder Alerts</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Purchase Orders"
          value={String(purchaseOrders.length)}
          description="In production & transit"
          icon={<Briefcase className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="In-Transit PO Value"
          value="$9,555.00"
          description="Total landed inventory incoming"
          icon={<Truck className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Supplier On-Time Rate"
          value="97.3%"
          trend={{ value: 1.2, isPositive: true }}
          description="Across 3 approved vendors"
          icon={<PackageCheck className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="Reorder Triggers"
          value={String(reorderRecommendations.filter((r) => r.reorderQuantity > 0).length)}
          description="SKUs below safety stock buffer"
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pos'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Purchase Orders</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{purchaseOrders.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('reorder')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'reorder'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Velocity Reorder Queue</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 font-bold">
            {reorderRecommendations.filter((r) => r.reorderQuantity > 0).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'suppliers'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Supplier Directory & Scorecards</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{suppliers.length}</span>
        </button>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Units</th>
                  <th className="py-3 px-4">Goods Cost</th>
                  <th className="py-3 px-4">Freight & Duty</th>
                  <th className="py-3 px-4">Total Landed Cost</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{po.poNumber}</td>
                    <td className="py-3.5 px-4 text-zinc-200">
                      <p>{po.supplierName}</p>
                      <p className="text-[11px] font-mono text-zinc-500">{po.supplierCode}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          po.status === 'confirmed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : po.status === 'sent'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">{po.itemsCount} units</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      ${(po.totalGoodsMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 text-xs">
                      +${((po.freightCostMinor + po.customsDutiesMinor) / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">
                      ${(po.totalLandedCostMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">{po.expectedDelivery}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showToast(`Receiving dock opened for ${po.poNumber}`)}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        Receive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Velocity Reorder Queue */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Automated Replenishment Engine</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculates stock deficits using trailing 28-day velocity, supplier lead time, and safety buffer, automatically enforcing MOQ.
              </p>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Forecast sync active</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Incoming</th>
                  <th className="py-3 px-4">Daily Velocity</th>
                  <th className="py-3 px-4">Target Level</th>
                  <th className="py-3 px-4">Suggested Reorder</th>
                  <th className="py-3 px-4">Estimated Cost</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {reorderRecommendations.map((rec) => (
                  <tr key={rec.sku} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-100">
                      <p>{rec.title}</p>
                      <p className="text-xs font-mono text-zinc-400">{rec.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200">{rec.currentAvailable} units</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">+{rec.currentIncoming}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">~{rec.leadTimeDemand / 14} /day</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{rec.targetStockLevel}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {rec.reorderQuantity > 0 ? `${rec.reorderQuantity} units (MOQ)` : '0 (OK)'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200">
                      ${(rec.estimatedCostMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.urgency === 'critical' ? (
                        <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/20">
                          Critical Stock
                        </span>
                      ) : rec.urgency === 'reorder_now' ? (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                          Reorder Now
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rec.reorderQuantity > 0 ? (
                        <button
                          onClick={() => handleCreateDraftPoFromReorder(rec)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create PO
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {suppliers.map((sup) => (
            <div key={sup.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] px-1.5 py-0.5">
                    {sup.code}
                  </span>
                  <h3 className="text-base font-bold text-zinc-100 mt-1">{sup.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{sup.contact}</p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Lead Time:</span>
                  <span className="font-semibold text-zinc-200">{sup.leadTimeDays} business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Minimum Order Qty (MOQ):</span>
                  <span className="font-semibold text-zinc-200">{sup.moq} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Terms:</span>
                  <span className="font-semibold text-zinc-200">{sup.paymentTerms}</span>
                </div>
              </div>

              {/* Scorecard */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Vendor Scorecard</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase">On-Time Rate</p>
                    <p className="text-sm font-bold text-emerald-400">{sup.onTimeDelivery}%</p>
                  </div>
                  <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase">Quality Pass</p>
                    <p className="text-sm font-bold text-emerald-400">{sup.qualityPassRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
