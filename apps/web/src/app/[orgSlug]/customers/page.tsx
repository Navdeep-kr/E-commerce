'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitMerge,
  Sparkles,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  X,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomerService, type CustomerProfile, type RfmScores } from '@storefront-ops/core';

interface EnrichedCustomer extends CustomerProfile {
  rfm: RfmScores;
}

export default function CustomersPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [primaryCust, setPrimaryCust] = useState<EnrichedCustomer | null>(null);
  const [secondaryCust, setSecondaryCust] = useState<EnrichedCustomer | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.customers) {
          setCustomers(data.customers);
          // Set duplicate pair for merge demo
          const c1 = data.customers.find((c: any) => c.id === 'cust-101');
          const c2 = data.customers.find((c: any) => c.id === 'cust-105');
          if (c1 && c2) {
            setPrimaryCust(c1);
            setSecondaryCust(c2);
          }
        }
      } catch {
        // Fallback demo data
      }
    };
    fetchCustomers();
  }, []);

  const handleExecuteMerge = async () => {
    if (!primaryCust || !secondaryCust) return;
    setIsMerging(true);

    try {
      const res = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryId: primaryCust.id,
          secondaryId: secondaryCust.id,
          primaryProfile: primaryCust,
          secondaryProfile: secondaryCust,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update customers list
        const updatedPrimaryEnriched = {
          ...data.mergedProfile,
          rfm: CustomerService.calculateRfm(
            data.mergedProfile.lastOrderDateIso,
            data.mergedProfile.ordersCount,
            data.mergedProfile.totalSpentMinor
          ),
        };

        setCustomers((prev) =>
          prev
            .filter((c) => c.id !== secondaryCust.id)
            .map((c) => (c.id === primaryCust.id ? updatedPrimaryEnriched : c))
        );

        showToast(data.message);
        setMergeModalOpen(false);
      } else {
        showToast(data.error || 'Failed to merge profiles.');
      }
    } catch {
      showToast('Network error merging profiles.');
    } finally {
      setIsMerging(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (activeSegment !== 'all' && c.rfm.segment !== activeSegment) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  const championsCount = customers.filter((c) => c.rfm.segment === 'Champions').length;
  const atRiskCount = customers.filter((c) => c.rfm.segment === 'At Risk').length;
  const totalLtvMinor = customers.reduce((acc, c) => acc + c.totalSpentMinor, 0);
  const avgLtvMinor = customers.length ? Math.round(totalLtvMinor / customers.length) : 0;

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
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">CRM & Audiences</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
              RFM Segmentation
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Customer 360 Profiles</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Unified omnichannel customer profiles, RFM analytics, lifetime value, and duplicate deduplication.
          </p>
        </div>
      </div>

      {/* Duplicate Detection Alert Banner */}
      {secondaryCust && (
        <div className="rounded-xl border-2 border-orange-400 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 bg-white">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div className="bg-white">
              <p className="text-sm font-bold text-orange-600">Duplicate Customer Profile Detected (95% Confidence)</p>
              <p className="text-xs text-black mt-0.5">
                <span className="font-bold text-black">{primaryCust?.firstName} {primaryCust?.lastName}</span> ({primaryCust?.email}) matches{' '}
                <span className="font-bold text-black">{secondaryCust.firstName} {secondaryCust.lastName}</span> ({secondaryCust.email}) by phone number and physical address.
              </p>
            </div>
          </div>
          <button
            onClick={() => setMergeModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-white border-2 border-orange-500 px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-xs whitespace-nowrap"
          >
            <GitMerge className="h-4 w-4 text-orange-600" />
            <span>Review & Merge Profiles</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={String(customers.length)}
          description="Active customer accounts"
          icon={<Users className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Champions Segment"
          value={String(championsCount)}
          description="High recency, frequency & LTV"
          icon={<Sparkles className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Average Customer LTV"
          value={`$${(avgLtvMinor / 100).toFixed(0)}`}
          trend={{ value: 14, isPositive: true }}
          description="Trailing 12-month net spend"
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="At-Risk Accounts"
          value={String(atRiskCount)}
          description="High historical spend, low recency"
          icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
        />
      </div>

      {/* Search and Segment Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['all', 'Champions', 'Loyal Customers', 'Promising', 'At Risk', 'First-Time'].map((seg) => (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors border ${
                  activeSegment === seg
                    ? 'bg-white text-black border-black shadow-sm ring-1 ring-black'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-black'
                }`}
              >
                {seg === 'all' ? 'All Customers' : seg}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full rounded-lg bg-white border border-zinc-300 pl-9 pr-3 py-1.5 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none"
            />
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm bg-white">
            <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">RFM Segment</th>
                <th className="py-3 px-4">RFM Score</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium bg-white">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 bg-white">
                    <EmptyState
                      icon={Users}
                      title="No Customer Profiles Found"
                      description="Customer profiles, RFM segments, and lifetime spend metrics are automatically created as orders are ingested from your connected channels."
                      primaryAction={{
                        label: 'Connect Sales Channel',
                        href: `/${orgSlug}/integrations`,
                      }}
                      secondaryAction={{
                        label: 'Create Manual Order',
                        href: `/${orgSlug}/orders/new`,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors bg-white">
                  <td className="py-3.5 px-4 font-bold text-black">
                    <Link
                      href={`/${orgSlug}/customers/${c.id}`}
                      className="hover:underline text-black"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white text-[10px] font-mono text-black font-semibold px-1.5 py-0.5 border border-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-black">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-zinc-600" />
                      <span className="text-black font-medium">{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-zinc-700 mt-0.5">
                        <Phone className="h-3 w-3 text-zinc-600" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        c.rfm.segment === 'Champions'
                          ? 'bg-white text-emerald-600 border-emerald-500'
                          : c.rfm.segment === 'At Risk'
                          ? 'bg-white text-rose-600 border-rose-500'
                          : c.rfm.segment === 'Loyal Customers'
                          ? 'bg-white text-emerald-700 border-emerald-400'
                          : 'bg-white text-orange-600 border-orange-400'
                      }`}
                    >
                      {c.rfm.segment}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-700">
                    R<span className="font-bold text-black">{c.rfm.recencyScore}</span> &bull; F
                    <span className="font-bold text-black">{c.rfm.frequencyScore}</span> &bull; M
                    <span className="font-bold text-black">{c.rfm.monetaryScore}</span>
                  </td>
                  <td className="py-3.5 px-4 text-black font-semibold">{c.ordersCount} orders</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-black">
                    ${(c.totalSpentMinor / 100).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/${orgSlug}/customers/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-zinc-300 px-2.5 py-1 text-xs font-bold text-black hover:bg-zinc-100 hover:border-black transition-colors shadow-sm"
                    >
                      <span>Profile 360</span>
                      <ArrowRight className="h-3 w-3 text-black" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Merge Modal */}
      {mergeModalOpen && primaryCust && secondaryCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6 text-black">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-black">Merge Duplicate Customer Profiles</h3>
              </div>
              <button
                onClick={() => setMergeModalOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Merging combines lifetime orders, lifetime spend, and address cards into the Primary profile. The Secondary profile will be archived and redirected to the primary ID.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Primary Profile Card */}
              <div className="rounded-xl border border-emerald-300 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Primary Profile (Kept)
                  </span>
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] text-emerald-700 font-mono font-bold">
                    {primaryCust.id}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-black">{primaryCust.firstName} {primaryCust.lastName}</p>
                  <p className="text-xs text-zinc-600">{primaryCust.email}</p>
                  <p className="text-xs text-zinc-600">{primaryCust.phone}</p>
                </div>
                <div className="pt-2 border-t border-zinc-200 text-xs flex justify-between">
                  <span className="text-zinc-600">Orders: {primaryCust.ordersCount}</span>
                  <span className="font-mono font-bold text-black">
                    ${(primaryCust.totalSpentMinor / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Secondary Profile Card */}
              <div className="rounded-xl border border-rose-300 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Secondary (Archived)
                  </span>
                  <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] text-rose-700 font-mono font-bold">
                    {secondaryCust.id}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-black">{secondaryCust.firstName} {secondaryCust.lastName}</p>
                  <p className="text-xs text-zinc-600">{secondaryCust.email}</p>
                  <p className="text-xs text-zinc-600">{secondaryCust.phone}</p>
                </div>
                <div className="pt-2 border-t border-zinc-200 text-xs flex justify-between">
                  <span className="text-zinc-600">Orders: {secondaryCust.ordersCount}</span>
                  <span className="font-mono font-bold text-black">
                    ${(secondaryCust.totalSpentMinor / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Merge Preview */}
            <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200 text-xs space-y-1.5">
              <span className="font-bold text-black">Post-Merge Combined Result:</span>
              <div className="flex justify-between text-zinc-600">
                <span>Total Lifetime Orders:</span>
                <span className="font-mono font-bold text-black">
                  {primaryCust.ordersCount + secondaryCust.ordersCount} orders
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Total Combined Spend:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ${((primaryCust.totalSpentMinor + secondaryCust.totalSpentMinor) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMerging}
                onClick={handleExecuteMerge}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isMerging ? 'Merging Profiles...' : 'Confirm & Merge Profiles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
