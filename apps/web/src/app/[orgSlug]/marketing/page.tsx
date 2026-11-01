'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Megaphone,
  Ticket,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Copy,
  Plus,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { MarketingService, type DiscountRule } from '@storefront-ops/core';

export default function MarketingPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'campaigns' | 'discounts' | 'utm'>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Discount Modal State
  const [createDiscountOpen, setCreateDiscountOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed_amount' | 'free_shipping'>('percentage');
  const [newValue, setNewValue] = useState(15);
  const [newStacking, setNewStacking] = useState<'exclusive' | 'stackable_with_shipping' | 'unrestricted'>('stackable_with_shipping');

  // UTM Builder State
  const [utmBaseUrl, setUtmBaseUrl] = useState('https://storefront.example.com/products/hoodie');
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmMedium, setUtmMedium] = useState('paid_social');
  const [utmCampaign, setUtmCampaign] = useState('fall_collection_2026');
  const [utmGenerated, setUtmGenerated] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cmpRes, discRes] = await Promise.all([
          fetch('/api/marketing/campaigns'),
          fetch('/api/marketing/discounts'),
        ]);
        const cmpData = await cmpRes.json();
        const discData = await discRes.json();

        if (cmpData.campaigns) setCampaigns(cmpData.campaigns);
        if (discData.discounts) setDiscounts(discData.discounts);
      } catch {
        // Fallback
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const link = MarketingService.buildUtmLink(utmBaseUrl, {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
      });
      setUtmGenerated(link);
    } catch {
      setUtmGenerated('');
    }
  }, [utmBaseUrl, utmSource, utmMedium, utmCampaign]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    try {
      const res = await fetch('/api/marketing/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          type: newType,
          value: newType === 'fixed_amount' ? newValue * 100 : newValue,
          stackingRule: newStacking,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDiscounts((prev) => [data.discount, ...prev]);
        setCreateDiscountOpen(false);
        showToast(data.message);
        setNewCode('');
      } else {
        showToast(data.error || 'Failed to create discount.');
      }
    } catch {
      showToast('Network error creating discount.');
    }
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
            <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">Marketing & Growth</span>
            <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-medium text-pink-400 border border-pink-500/20">
              Stacking Rules Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Marketing & Promotions</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Omnichannel campaigns, promotional discounts with stacking validation, and ROAS/CAC/MER attribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateDiscountOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-950/40 hover:bg-pink-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Discount Code</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Paid Ad Spend"
          value="$28,500.00"
          description="Meta, Google & TikTok ads"
          icon={<DollarSign className="h-5 w-5 text-pink-400" />}
        />
        <KpiCard
          title="Attributed Revenue"
          value="$134,000.00"
          description="Direct conversion tracking"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Blended MER"
          value="6.09x"
          trend={{ value: 8.4, isPositive: true }}
          description="Store Gross Sales / Total Ad Spend"
          icon={<Sparkles className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Blended CAC"
          value="$43.51"
          trend={{ value: 5.2, isPositive: true }}
          description="Average customer acquisition cost"
          icon={<Users className="h-5 w-5 text-amber-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'campaigns'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Active Campaigns</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{campaigns.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'discounts'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Discounts & Stacking</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{discounts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('utm')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'utm'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>UTM Campaign Link Builder</span>
        </button>
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ad Spend</th>
                  <th className="py-3 px-4">Attributed Revenue</th>
                  <th className="py-3 px-4">ROAS</th>
                  <th className="py-3 px-4">CAC</th>
                  <th className="py-3 px-4 text-right">New Customers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {campaigns.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-100">{cmp.name}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-300">{cmp.channel}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 capitalize">
                        {cmp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-200">
                      ${(cmp.adSpendMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      ${(cmp.attributedRevenueMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{cmp.roas}x</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      ${(cmp.cacMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-100">
                      +{cmp.newCustomersCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Discounts & Stacking */}
      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Type</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Min Spend</th>
                  <th className="py-3 px-4">Stacking Policy</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-pink-400">{d.code}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-300 capitalize">{d.type.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-100">
                      {d.type === 'percentage'
                        ? `${d.value}% Off`
                        : d.type === 'fixed_amount'
                        ? `$${(d.value / 100).toFixed(2)} Off`
                        : d.type === 'free_shipping'
                        ? 'Free Shipping'
                        : 'Tiered Threshold'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                      {d.minSpendMinor ? `$${(d.minSpendMinor / 100).toFixed(2)}` : 'None'}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.stackingRule === 'exclusive' ? (
                        <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/20">
                          Exclusive (No Stacking)
                        </span>
                      ) : d.stackingRule === 'stackable_with_shipping' ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
                          Stacks with Shipping
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                          Unrestricted Stacking
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-300">
                      {d.currentUsageCount || 0} / {d.maxUsageTotal || '&infin;'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="rounded bg-zinc-800 text-[11px] text-zinc-300 px-2 py-0.5">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: UTM Link Builder */}
      {activeTab === 'utm' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Marketing Campaign Link Builder</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generate standardized UTM links for Meta, Google, TikTok, and influencer affiliate tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Destination URL:</label>
              <input
                type="text"
                value={utmBaseUrl}
                onChange={(e) => setUtmBaseUrl(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Campaign Name (utm_campaign):</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Source (utm_source):</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="instagram, google, newsletter"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Medium (utm_medium):</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="paid_social, cpc, email"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono"
              />
            </div>
          </div>

          <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-zinc-400">Generated Tracking Link:</span>
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-pink-400 bg-zinc-900 p-2.5 rounded border border-zinc-800 break-all">
              <span>{utmGenerated}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(utmGenerated);
                  showToast('Tracking URL copied to clipboard!');
                }}
                className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 text-xs whitespace-nowrap"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Discount Modal */}
      {createDiscountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Create Promotional Discount</h3>
              <button
                onClick={() => setCreateDiscountOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Coupon Code:</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. FLASH20"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 font-mono uppercase text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Discount Type:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200"
                >
                  <option value="percentage">Percentage Discount (% off)</option>
                  <option value="fixed_amount">Fixed Amount ($ off)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {newType !== 'free_shipping' && (
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    {newType === 'percentage' ? 'Percentage Off (%):' : 'Amount Off ($):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 font-mono text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Stacking Rule Policy:</label>
                <select
                  value={newStacking}
                  onChange={(e) => setNewStacking(e.target.value as any)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200"
                >
                  <option value="stackable_with_shipping">Stackable with Free Shipping only (Standard)</option>
                  <option value="exclusive">Exclusive (Cannot combine with any code)</option>
                  <option value="unrestricted">Unrestricted (Can stack with other promotions)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateDiscountOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-pink-600 px-5 py-2 font-bold text-white hover:bg-pink-500 shadow-lg shadow-pink-950/40"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
