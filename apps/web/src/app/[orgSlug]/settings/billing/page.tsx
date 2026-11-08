'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function BillingPage() {
  const routeParams = useParams();
  const orgSlug = (routeParams?.orgSlug as string) || 'acme-commerce';

  const [currentPlanId, setCurrentPlanId] = useState<'starter' | 'growth' | 'scale'>('growth');
  const [billingCadence, setBillingCadence] = useState<'monthly' | 'annual'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      description: 'Essential operations for growing direct-to-consumer brands.',
      monthlyPrice: 49,
      annualPrice: 490,
      limits: {
        orders: '500 orders/mo',
        skus: '100 SKUs',
        seats: '2 team seats',
        apiKeys: false,
        customReports: false,
      },
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      description: 'High-velocity operations with automated wave picking and carrier rate shopping.',
      monthlyPrice: 149,
      annualPrice: 1490,
      limits: {
        orders: '2,500 orders/mo',
        skus: '1,000 SKUs',
        seats: '5 team seats',
        apiKeys: true,
        customReports: true,
      },
      popular: true,
    },
    {
      id: 'scale' as const,
      name: 'Scale',
      description: 'Enterprise omnichannel operations with unlimited throughput and dedicated support.',
      monthlyPrice: 399,
      annualPrice: 3990,
      limits: {
        orders: 'Unlimited orders',
        skus: 'Unlimited SKUs',
        seats: '20 team seats',
        apiKeys: true,
        customReports: true,
      },
    },
  ];

  const handleUpgrade = async (planId: 'starter' | 'growth' | 'scale') => {
    setIsUpgrading(true);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cadence: billingCadence }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPlanId(planId);
        setSuccessMessage(`Plan successfully updated to ${data.plan.name}!`);
      }
    } catch {
      // Fallback local update
      setCurrentPlanId(planId);
      setSuccessMessage(`Plan updated to ${planId.toUpperCase()}!`);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="w-full space-y-8 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-black" />
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Subscription & Usage Metering
            </h1>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Manage your store plan, monitor real-time monthly usage quotas, and view invoice history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-green-700 border border-green-300 flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Subscription Active (via Stripe)
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-white border-2 border-green-500 text-green-700 rounded-xl text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-black">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-black font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Usage Metering Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meter 1: Orders */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 flex items-center gap-1.5 font-semibold">
              <ShoppingCart className="h-4 w-4 text-black" /> Monthly Orders
            </span>
            <span className="font-bold text-black">
              1,420 / {currentPlanId === 'scale' ? '∞' : currentPlanId === 'growth' ? '2,500' : '500'}
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentPlanId === 'starter' ? 'bg-red-600 w-full' : 'bg-black w-[56.8%]'
              }`}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 font-medium">
            <span>56.8% consumed</span>
            <span>Resets Dec 1, 2026</span>
          </div>
        </div>

        {/* Meter 2: Active SKUs */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 flex items-center gap-1.5 font-semibold">
              <Package className="h-4 w-4 text-black" /> Catalog SKUs
            </span>
            <span className="font-bold text-black">
              380 / {currentPlanId === 'scale' ? '∞' : currentPlanId === 'growth' ? '1,000' : '100'}
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentPlanId === 'starter' ? 'bg-red-600 w-full' : 'bg-green-600 w-[38.0%]'
              }`}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 font-medium">
            <span>38.0% capacity</span>
            <span>All locations tracked</span>
          </div>
        </div>

        {/* Meter 3: Team Seats */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 flex items-center gap-1.5 font-semibold">
              <Users className="h-4 w-4 text-black" /> Team Seats
            </span>
            <span className="font-bold text-black">
              4 / {currentPlanId === 'scale' ? '20' : currentPlanId === 'growth' ? '5' : '2'}
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentPlanId === 'starter' ? 'bg-red-600 w-full' : 'bg-orange-600 w-[80.0%]'
              }`}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 font-medium">
            <span>1 seat remaining</span>
            <span>Role RBAC active</span>
          </div>
        </div>
      </div>

      {/* Cadence Toggle */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="inline-flex items-center p-1 bg-white border border-zinc-200 rounded-xl shadow-xs">
          <button
            onClick={() => setBillingCadence('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              billingCadence === 'monthly'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCadence('annual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              billingCadence === 'annual'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Annual Billing <span className="text-[10px] bg-white text-green-700 border border-green-300 px-1.5 py-0.5 rounded font-bold">2 Months Free</span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlanId === p.id;
          const price = billingCadence === 'monthly' ? p.monthlyPrice : Math.round(p.annualPrice / 12);

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 flex flex-col justify-between transition shadow-sm bg-white ${
                isCurrent
                  ? 'border-2 border-green-600 ring-2 ring-green-600/20'
                  : 'border-zinc-200 hover:border-black'
              }`}
            >
              {p.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
                  Most Popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow">
                  Current Plan
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-black">{p.name}</h3>
                  <p className="text-xs text-zinc-600 mt-1 min-h-[32px]">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-black">${price}</span>
                  <span className="text-xs text-zinc-500 font-semibold">/ month</span>
                </div>

                <ul className="space-y-2 text-xs text-zinc-700 pt-3 border-t border-zinc-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{p.limits.orders}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{p.limits.skus}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{p.limits.seats}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>AI Operations Copilot & Forecasting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {p.limits.apiKeys ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <span className="text-zinc-400 line-through">Public REST API & Webhooks</span>
                    )}
                    {p.limits.apiKeys && <span>Public REST API & Webhooks</span>}
                  </li>
                  <li className="flex items-center gap-2">
                    {p.limits.customReports ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <span className="text-zinc-400 line-through">Custom SQL Report Builder</span>
                    )}
                    {p.limits.customReports && <span>Custom SQL Report Builder</span>}
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={isCurrent || isUpgrading}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                      : 'bg-black hover:bg-zinc-800 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                  {!isCurrent && <ArrowUpRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History Section */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Receipt className="h-4 w-4 text-black" /> Recent Billing Invoices
          </h2>
          <span className="text-xs text-zinc-500 font-medium">Billed to Visa ending in 4242</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-zinc-200 text-black uppercase font-bold">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Plan / Description</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-mono font-bold text-black">INV-2026-11</td>
                <td className="py-3 px-4 text-zinc-600">Nov 1, 2026</td>
                <td className="py-3 px-4 text-black">Growth Monthly Subscription</td>
                <td className="py-3 px-4 font-bold text-black">$149.00</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-green-700 border border-green-300">
                    PAID
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <a href="#" className="text-black font-bold hover:underline">Download</a>
                </td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-mono font-bold text-black">INV-2026-10</td>
                <td className="py-3 px-4 text-zinc-600">Oct 1, 2026</td>
                <td className="py-3 px-4 text-black">Growth Monthly Subscription</td>
                <td className="py-3 px-4 font-bold text-black">$149.00</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-green-700 border border-green-300">
                    PAID
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <a href="#" className="text-black font-bold hover:underline">Download</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
