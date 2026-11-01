'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { type ReturnConditionGrade } from '@storefront-ops/core';

interface ReturnRecord {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  sku: string;
  quantity: number;
  reason: 'wrong_size' | 'damaged' | 'not_as_described' | 'changed_mind' | 'defective';
  status: 'requested' | 'in_transit' | 'received' | 'graded' | 'refunded';
  conditionGrade: ReturnConditionGrade | null;
  refundAmountMinor: number;
  createdAt: string;
}

export default function ReturnsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([
    {
      id: 'ret-1001',
      rmaNumber: 'RMA-90812',
      orderNumber: 'ORD-10842',
      customerName: 'Marcus Vance',
      customerEmail: 'm.vance@example.com',
      sku: 'HOODIE-BLK-M',
      quantity: 1,
      reason: 'wrong_size',
      status: 'received',
      conditionGrade: null,
      refundAmountMinor: 8500,
      createdAt: '2026-10-30T14:10:00Z',
    },
    {
      id: 'ret-1002',
      rmaNumber: 'RMA-90813',
      orderNumber: 'ORD-10839',
      customerName: 'Sarah Jenkins',
      customerEmail: 's.jenkins@example.com',
      sku: 'JACKET-DWN-L',
      quantity: 1,
      reason: 'damaged',
      status: 'in_transit',
      conditionGrade: null,
      refundAmountMinor: 19500,
      createdAt: '2026-10-31T09:20:00Z',
    },
    {
      id: 'ret-1003',
      rmaNumber: 'RMA-90809',
      orderNumber: 'ORD-10825',
      customerName: 'Elena Rostova',
      customerEmail: 'elena.r@example.com',
      sku: 'TEE-WHT-L',
      quantity: 2,
      reason: 'changed_mind',
      status: 'graded',
      conditionGrade: 'restock',
      refundAmountMinor: 5600,
      createdAt: '2026-10-28T16:45:00Z',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'in_transit' | 'graded'>('all');
  const [selectedForGrading, setSelectedForGrading] = useState<ReturnRecord | null>(null);
  const [gradingChoice, setGradingChoice] = useState<ReturnConditionGrade>('restock');
  const [targetBin, setTargetBin] = useState<string>('R-01-A');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleGradeSubmit = async () => {
    if (!selectedForGrading) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/returns/${selectedForGrading.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditionGrade: gradingChoice,
          targetBinLocation: gradingChoice === 'restock' ? targetBin : undefined,
          processedByStaffId: 'staff-warehouse-lead',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReturnsList((prev) =>
          prev.map((r) =>
            r.id === selectedForGrading.id
              ? {
                  ...r,
                  status: 'graded',
                  conditionGrade: gradingChoice,
                }
              : r
          )
        );
        showToast(data.message);
        setSelectedForGrading(null);
      } else {
        showToast(data.error || 'Failed to grade return.');
      }
    } catch {
      showToast('Network error submitting return grade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = returnsList.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

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
            <span className="text-xs font-semibold uppercase tracking-wider text-black">Reverse Logistics</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300">
              Warehouse Grading
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Returns & RMA Management</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Intake inspection dock, condition grading, automatic restock ledger sync, and Stripe refund execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/returns/portal`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 text-black" />
            <span>Customer Return Portal</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Awaiting Inspection"
          value="4"
          description="Packages arrived at warehouse dock"
          icon={<RotateCcw className="h-5 w-5 text-orange-600" />}
        />
        <KpiCard
          title="In Transit Returns"
          value="12"
          description="Carrier scanned return labels"
          icon={<Package className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="Return Rate"
          value="4.2%"
          trend={{ value: 0.8, isPositive: true }}
          description="Below 5.0% industry benchmark"
          icon={<TrendingDown className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Restock Rate"
          value="82%"
          description="Graded resalable & returned to bins"
          icon={<ShieldCheck className="h-5 w-5 text-black" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        {(['all', 'received', 'in_transit', 'graded'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-xs font-bold capitalize transition-colors ${
              activeTab === tab
                ? 'border-black text-black'
                : 'border-transparent text-zinc-600 hover:text-black'
            }`}
          >
            {tab === 'all' ? 'All Returns' : tab === 'received' ? 'Awaiting Inspection' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Returns Queue Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm bg-white">
          <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">RMA / Return #</th>
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Item & Reason</th>
              <th className="py-3 px-4">Refund Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Grade</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 font-medium bg-white">
            {filtered.map((ret) => (
              <tr key={ret.id} className="hover:bg-zinc-50 transition-colors bg-white">
                <td className="py-3.5 px-4 font-mono font-bold text-black">{ret.rmaNumber}</td>
                <td className="py-3.5 px-4 font-mono text-zinc-700">{ret.orderNumber}</td>
                <td className="py-3.5 px-4 text-black">
                  <p className="font-bold">{ret.customerName}</p>
                  <p className="text-xs text-zinc-500 font-medium">{ret.customerEmail}</p>
                </td>
                <td className="py-3.5 px-4 text-xs">
                  <p className="font-mono font-bold text-black">{ret.sku} (x{ret.quantity})</p>
                  <p className="text-zinc-600 capitalize font-medium">{ret.reason.replace('_', ' ')}</p>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-black">
                  ${(ret.refundAmountMinor / 100).toFixed(2)}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      ret.status === 'received'
                        ? 'bg-white text-orange-600 border-orange-400'
                        : ret.status === 'graded'
                        ? 'bg-white text-emerald-700 border-emerald-500'
                        : 'bg-white text-zinc-700 border-zinc-300'
                    }`}
                  >
                    {ret.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {ret.conditionGrade ? (
                    <span className="font-mono text-xs uppercase font-bold text-black">
                      {ret.conditionGrade}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs italic font-medium">Uninspected</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {ret.status === 'received' ? (
                    <button
                      onClick={() => setSelectedForGrading(ret)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 shadow-sm transition-colors"
                    >
                      <Barcode className="h-3.5 w-3.5" />
                      Grade & Restock
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 font-semibold">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warehouse Condition Grading Modal */}
      {selectedForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-black">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-black">{selectedForGrading.rmaNumber}</span>
                <h3 className="text-lg font-bold text-black">Intake Condition Grading</h3>
              </div>
              <button
                onClick={() => setSelectedForGrading(null)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Order:</span>
                <span className="font-mono font-bold text-black">{selectedForGrading.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Item:</span>
                <span className="font-mono font-bold text-black">{selectedForGrading.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Customer Reason:</span>
                <span className="text-black capitalize font-semibold">{selectedForGrading.reason.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-1.5">
                <span className="text-zinc-600 font-medium">Net Refund Payable:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  ${(selectedForGrading.refundAmountMinor / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Condition Grade Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-black uppercase tracking-wider">
                Select Physical Condition:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setGradingChoice('restock')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'restock'
                      ? 'border-2 border-emerald-600 bg-white text-emerald-700 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-black'
                  }`}
                >
                  <p className="text-sm font-bold">Restock</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Like new & resellable</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingChoice('quarantine')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'quarantine'
                      ? 'border-2 border-orange-500 bg-white text-orange-600 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-black'
                  }`}
                >
                  <p className="text-sm font-bold">Quarantine</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Needs cleaning/repair</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingChoice('dispose')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'dispose'
                      ? 'border-2 border-red-500 bg-white text-red-600 font-bold shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-black'
                  }`}
                >
                  <p className="text-sm font-bold">Dispose</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Damaged / Write-off</p>
                </button>
              </div>
            </div>

            {gradingChoice === 'restock' && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-black">Target Restock Bin Location:</span>
                  <input
                    type="text"
                    value={targetBin}
                    onChange={(e) => setTargetBin(e.target.value)}
                    className="w-24 bg-white border border-zinc-300 rounded px-2 py-1 font-mono text-right text-black font-bold focus:border-black focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-zinc-600 font-medium">
                  &bull; Automatically adds +{selectedForGrading.quantity} to inventory ledger upon submission.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setSelectedForGrading(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGradeSubmit}
                className="rounded-lg bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Processing Refund & Stock...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm Grade & Issue Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
