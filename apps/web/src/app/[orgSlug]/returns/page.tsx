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
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleGradeSubmit = async () => {
    if (!selectedForGrading) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/returns/${selectedForGrading.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedForGrading.orderNumber,
          sku: selectedForGrading.sku,
          quantity: selectedForGrading.quantity,
          unitPriceMinor: selectedForGrading.refundAmountMinor / selectedForGrading.quantity,
          grade: gradingChoice,
          targetBin,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReturnsList((prev) =>
          prev.map((r) =>
            r.id === selectedForGrading.id
              ? { ...r, status: 'graded', conditionGrade: gradingChoice }
              : r
          )
        );
        showToast(data.message);
        setSelectedForGrading(null);
      } else {
        showToast(data.error || 'Failed to complete grading.');
      }
    } catch {
      showToast('Network error during grading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = returnsList.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

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
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Warehouse Operations</span>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
              Receiving & Inspection
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Returns & Exchanges</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Intake inspection, condition grading (restock/dispose), automated refunds, and customer return portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${orgSlug}/returns/portal`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
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
          icon={<RotateCcw className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="In Transit Returns"
          value="12"
          description="Carrier scanned return labels"
          icon={<Package className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Return Rate"
          value="4.2%"
          trend={{ value: 0.8, isPositive: true }}
          description="Below 5.0% industry benchmark"
          icon={<TrendingDown className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Restock Rate"
          value="82%"
          description="Graded resalable & returned to bins"
          icon={<ShieldCheck className="h-5 w-5 text-indigo-400" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        {(['all', 'received', 'in_transit', 'graded'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'all' ? 'All Returns' : tab === 'received' ? 'Awaiting Inspection' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Returns Queue Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
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
          <tbody className="divide-y divide-zinc-800 font-medium">
            {filtered.map((ret) => (
              <tr key={ret.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">{ret.rmaNumber}</td>
                <td className="py-3.5 px-4 font-mono text-zinc-300">{ret.orderNumber}</td>
                <td className="py-3.5 px-4 text-zinc-200">
                  <p>{ret.customerName}</p>
                  <p className="text-xs text-zinc-500">{ret.customerEmail}</p>
                </td>
                <td className="py-3.5 px-4 text-xs">
                  <p className="font-mono text-zinc-200">{ret.sku} (x{ret.quantity})</p>
                  <p className="text-zinc-400 capitalize">{ret.reason.replace('_', ' ')}</p>
                </td>
                <td className="py-3.5 px-4 font-mono text-zinc-200">
                  ${(ret.refundAmountMinor / 100).toFixed(2)}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ret.status === 'received'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : ret.status === 'graded'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {ret.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {ret.conditionGrade ? (
                    <span className="font-mono text-xs uppercase font-bold text-zinc-300">
                      {ret.conditionGrade}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-xs italic">Uninspected</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {ret.status === 'received' ? (
                    <button
                      onClick={() => setSelectedForGrading(ret)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm transition-colors"
                    >
                      <Barcode className="h-3.5 w-3.5" />
                      Grade & Restock
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warehouse Condition Grading Modal */}
      {selectedForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-rose-400">{selectedForGrading.rmaNumber}</span>
                <h3 className="text-lg font-bold text-zinc-100">Intake Condition Grading</h3>
              </div>
              <button
                onClick={() => setSelectedForGrading(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Order:</span>
                <span className="font-mono text-zinc-200">{selectedForGrading.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Item:</span>
                <span className="font-mono font-bold text-zinc-100">{selectedForGrading.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Customer Reason:</span>
                <span className="text-zinc-300 capitalize">{selectedForGrading.reason.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-1">
                <span className="text-zinc-400">Net Refund Payable:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${(selectedForGrading.refundAmountMinor / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Condition Grade Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Select Physical Condition:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setGradingChoice('restock')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'restock'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-sm">Restock</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Like new & resellable</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingChoice('quarantine')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'quarantine'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-sm">Quarantine</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Needs cleaning/repair</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGradingChoice('dispose')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    gradingChoice === 'dispose'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-sm">Dispose</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Damaged / Write-off</p>
                </button>
              </div>
            </div>

            {gradingChoice === 'restock' && (
              <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-300">Target Restock Bin Location:</span>
                  <input
                    type="text"
                    value={targetBin}
                    onChange={(e) => setTargetBin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 font-mono text-right text-emerald-400 font-bold"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  &bull; Automatically adds +{selectedForGrading.quantity} to inventory ledger upon submission.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForGrading(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGradeSubmit}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
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
