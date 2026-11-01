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
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
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
    const stockItems: ReorderItemInput[] = [
      {
        sku: 'HOODIE-BLK-XL',
        title: 'Heavyweight Fleece Hoodie (Black / XL)',
        availableStock: 2,
        incomingStock: 100,
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
    <div className="space-y-6 bg-white min-h-screen text-black">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-black">Procurement & Supply Chain</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300">
              Landed Cost Allocation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Purchasing & Suppliers</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Purchase orders lifecycle, landed cost freight allocation, supplier scorecards, and velocity reorder queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('reorder')}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
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
          icon={<Briefcase className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="In-Transit PO Value"
          value="$9,555.00"
          description="Total landed inventory incoming"
          icon={<Truck className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="Supplier On-Time Rate"
          value="97.3%"
          trend={{ value: 1.2, isPositive: true }}
          description="Across 3 approved vendors"
          icon={<PackageCheck className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Reorder Triggers"
          value={String(reorderRecommendations.filter((r) => r.reorderQuantity > 0).length)}
          description="SKUs below safety stock buffer"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'pos'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Purchase Orders</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {purchaseOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reorder')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'reorder'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Velocity Reorder Queue</span>
          <span className="rounded-full bg-white border border-orange-400 px-2 py-0.5 text-xs text-orange-600 font-mono font-bold">
            {reorderRecommendations.filter((r) => r.reorderQuantity > 0).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'suppliers'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Supplier Directory & Scorecards</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Purchase Orders */}
      {activeTab === 'pos' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-zinc-50 transition-colors bg-white">
                    <td className="py-3.5 px-4 font-mono font-bold text-black">{po.poNumber}</td>
                    <td className="py-3.5 px-4 text-black">
                      <p className="font-bold">{po.supplierName}</p>
                      <p className="text-[11px] font-mono text-zinc-500 font-medium">{po.supplierCode}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold border capitalize ${
                          po.status === 'confirmed'
                            ? 'bg-white text-emerald-700 border-emerald-500'
                            : po.status === 'sent'
                            ? 'bg-white text-black border-zinc-300'
                            : 'bg-white text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-black font-semibold">{po.itemsCount} units</td>
                    <td className="py-3.5 px-4 font-mono text-black font-medium">
                      ${(po.totalGoodsMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600 text-xs font-medium">
                      +${((po.freightCostMinor + po.customsDutiesMinor) / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      ${(po.totalLandedCostMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-zinc-600 font-medium">{po.expectedDelivery}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showToast(`Receiving dock opened for ${po.poNumber}`)}
                        className="inline-flex items-center gap-1 rounded-md bg-white border border-zinc-300 px-2.5 py-1 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-xs"
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
          <div className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-black">Automated Replenishment Engine</h3>
              <p className="text-xs text-zinc-600 mt-0.5 font-medium">
                Calculates stock deficits using trailing 28-day velocity, supplier lead time, and safety buffer, automatically enforcing MOQ.
              </p>
            </div>
            <div className="text-xs text-zinc-600 font-medium flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
              <span>Forecast sync active</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {reorderRecommendations.map((rec) => (
                  <tr key={rec.sku} className="hover:bg-zinc-50 transition-colors bg-white">
                    <td className="py-3.5 px-4 font-bold text-black">
                      <p>{rec.title}</p>
                      <p className="text-xs font-mono text-zinc-500 font-medium">{rec.sku}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-black font-semibold">{rec.currentAvailable} units</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600 font-medium">+{rec.currentIncoming}</td>
                    <td className="py-3.5 px-4 font-mono text-black">~{rec.leadTimeDemand / 14} /day</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600 font-medium">{rec.targetStockLevel}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                      {rec.reorderQuantity > 0 ? `${rec.reorderQuantity} units (MOQ)` : '0 (OK)'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      ${(rec.estimatedCostMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.urgency === 'critical' ? (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-red-600 border border-red-500">
                          Critical Stock
                        </span>
                      ) : rec.urgency === 'reorder_now' ? (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-orange-600 border border-orange-400">
                          Reorder Now
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-500">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {rec.reorderQuantity > 0 ? (
                        <button
                          onClick={() => handleCreateDraftPoFromReorder(rec)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create PO
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500 font-semibold">In Stock</span>
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
            <div key={sup.id} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-white border border-zinc-300 text-black font-mono font-bold text-[10px] px-1.5 py-0.5">
                    {sup.code}
                  </span>
                  <h3 className="text-base font-bold text-black mt-1">{sup.name}</h3>
                  <p className="text-xs text-zinc-600 font-medium mt-0.5">{sup.contact}</p>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Lead Time:</span>
                  <span className="font-bold text-black">{sup.leadTimeDays} business days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Minimum Order Qty (MOQ):</span>
                  <span className="font-bold text-black">{sup.moq} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-medium">Payment Terms:</span>
                  <span className="font-bold text-black">{sup.paymentTerms}</span>
                </div>
              </div>

              {/* Scorecard */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-black">Vendor Scorecard</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 border border-zinc-200 shadow-xs">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">On-Time Rate</p>
                    <p className="text-sm font-bold text-emerald-600">{sup.onTimeDelivery}%</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-zinc-200 shadow-xs">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Quality Pass</p>
                    <p className="text-sm font-bold text-emerald-600">{sup.qualityPassRate}%</p>
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
