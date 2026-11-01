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
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
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

  useEffect(() => {
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
        showToast(data.message);
        setCreateDiscountOpen(false);
        setNewCode('');
        await fetchData();
      } else {
        showToast(data.error || 'Failed to create discount.');
      }
    } catch {
      showToast('Network error creating discount.');
    }
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
            <span className="text-xs font-semibold uppercase tracking-wider text-black">Growth & Acquisition</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300">
              Multi-Touch Attribution
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Marketing Campaigns & Promotions</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Omnichannel ad performance, blended ROAS tracking, discount stacking rules, and UTM campaign links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateDiscountOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Ad Spend"
          value="$13,250.00"
          description="Meta, Google & TikTok"
          icon={<DollarSign className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="Attributed Revenue"
          value="$63,600.00"
          trend={{ value: 24, isPositive: true }}
          description="First & last click attribution"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Blended ROAS"
          value="4.8x"
          trend={{ value: 0.6, isPositive: true }}
          description="Return on ad spend"
          icon={<Percent className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Total New Customers"
          value="480"
          description="Paid acquisition channels"
          icon={<Users className="h-5 w-5 text-black" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'campaigns'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Active Campaigns</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'discounts'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Ticket className="h-4 w-4" />
          <span>Discounts & Stacking</span>
          <span className="rounded-full bg-white border border-zinc-300 px-2 py-0.5 text-xs text-black font-mono">
            {discounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('utm')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'utm'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>UTM Campaign Link Builder</span>
        </button>
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {campaigns.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-zinc-50 transition-colors bg-white">
                    <td className="py-3.5 px-4 font-bold text-black">{cmp.name}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-600 font-medium">{cmp.channel}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-500 capitalize">
                        {cmp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      ${(cmp.adSpendMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      ${(cmp.attributedRevenueMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">{cmp.roas}x</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700">
                      ${(cmp.cacMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-black">
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
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200 font-medium bg-white">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50 transition-colors bg-white">
                    <td className="py-3.5 px-4 font-mono font-bold text-black">{d.code}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-600 capitalize font-medium">{d.type.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-black">
                      {d.type === 'percentage'
                        ? `${d.value}% Off`
                        : d.type === 'fixed_amount'
                        ? `$${(d.value / 100).toFixed(2)} Off`
                        : d.type === 'free_shipping'
                        ? 'Free Shipping'
                        : 'Tiered Threshold'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-600 font-medium">
                      {d.minSpendMinor ? `$${(d.minSpendMinor / 100).toFixed(2)}` : 'None'}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.stackingRule === 'exclusive' ? (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-red-600 border border-red-500">
                          Exclusive (No Stacking)
                        </span>
                      ) : d.stackingRule === 'stackable_with_shipping' ? (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-orange-600 border border-orange-400">
                          Stacks with Shipping
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-500">
                          Unrestricted Stacking
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-black font-semibold">
                      {d.currentUsageCount || 0} / {d.maxUsageTotal || '∞'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="rounded bg-white border border-zinc-300 text-[11px] font-bold text-black px-2 py-0.5">Active</span>
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
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-black">Marketing Campaign Link Builder</h3>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium">
              Generate standardized UTM links for Meta, Google, TikTok, and influencer affiliate tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-black font-bold mb-1">Destination URL:</label>
              <input
                type="text"
                value={utmBaseUrl}
                onChange={(e) => setUtmBaseUrl(e.target.value)}
                className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-black font-bold mb-1">Campaign Name (utm_campaign):</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-black font-bold mb-1">Source (utm_source):</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="instagram, google, newsletter"
                className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-black font-bold mb-1">Medium (utm_medium):</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="paid_social, cpc, email"
                className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200 space-y-2">
            <span className="text-xs font-bold text-black">Generated Tracking Link:</span>
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-black bg-white p-2.5 rounded border border-zinc-300 break-all">
              <span>{utmGenerated}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(utmGenerated);
                  showToast('Tracking URL copied to clipboard!');
                }}
                className="flex items-center gap-1 rounded bg-black hover:bg-zinc-800 text-white px-3 py-1 text-xs font-bold whitespace-nowrap shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-black">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-bold text-black">Create Promotional Discount</h3>
              <button
                onClick={() => setCreateDiscountOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Coupon Code:</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. FLASH20"
                  className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 font-mono uppercase text-black font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Discount Type:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-medium focus:border-black focus:outline-none"
                >
                  <option value="percentage">Percentage Discount (% off)</option>
                  <option value="fixed_amount">Fixed Amount ($ off)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {newType !== 'free_shipping' && (
                <div>
                  <label className="block font-bold text-black mb-1">
                    {newType === 'percentage' ? 'Percentage Off (%):' : 'Amount Off ($):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newValue}
                    onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 font-mono text-black font-bold focus:border-black focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-black mb-1">Stacking Rule Policy:</label>
                <select
                  value={newStacking}
                  onChange={(e) => setNewStacking(e.target.value as any)}
                  className="w-full rounded-lg bg-white border border-zinc-300 p-2.5 text-black font-medium focus:border-black focus:outline-none"
                >
                  <option value="stackable_with_shipping">Stackable with Free Shipping only (Standard)</option>
                  <option value="exclusive">Exclusive (Cannot combine with any code)</option>
                  <option value="unrestricted">Unrestricted (Can stack with other promotions)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setCreateDiscountOpen(false)}
                  className="px-4 py-2 text-zinc-600 hover:text-black font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-5 py-2 font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
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
