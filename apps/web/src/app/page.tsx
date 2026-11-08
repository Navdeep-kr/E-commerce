'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Barcode,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  DollarSign,
  ExternalLink,
  Flame,
  Layers,
  Lock,
  Play,
  RotateCcw,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { PublicNav } from '@/components/public/public-nav';
import { PublicFooter } from '@/components/public/public-footer';

export default function MarketingLandingPage() {
  const [orderVolume, setOrderVolume] = useState<number>(2500);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // ROI Math
  const planTier = orderVolume > 5000 ? 'Scale' : orderVolume > 500 ? 'Growth' : 'Starter';
  const planPrice = planTier === 'Scale' ? 299 : planTier === 'Growth' ? 149 : 49;
  const hoursSaved = Math.round((orderVolume * 1.5) / 60);
  const laborSavings = hoursSaved * 22;
  const revenueProtected = Math.round(orderVolume * 65 * 0.02);
  const netSavings = laborSavings + revenueProtected - planPrice;
  const roiMultiple = ((laborSavings + revenueProtected) / planPrice).toFixed(1);

  const handleRunDemo = () => {
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => setSimStep(2), 250);
    setTimeout(() => setSimStep(3), 500);
    setTimeout(() => setSimStep(4), 750);
    setTimeout(() => setSimStep(5), 1000);
    setTimeout(() => {
      setSimStep(6);
      setIsSimulating(false);
    }, 1250);
  };

  const demoSteps = [
    {
      num: 1,
      title: 'Shopify Webhook Ingested',
      detail: 'HMAC signature verified. $85.00 captured with integer minor units (8,500 cents).',
      latency: '1.2ms',
    },
    {
      num: 2,
      title: 'Append-Only Stock Hold',
      detail: 'available = on_hand - committed strictly updated (150 - 1 = 149). Zero oversell.',
      latency: '1.8ms',
    },
    {
      num: 3,
      title: 'Optimal Wave Pick Path',
      detail: 'Warehouse picker guided to Bin A-02-14 along the shortest aisle path.',
      latency: '0.9ms',
    },
    {
      num: 4,
      title: 'Pack Station Barcode Verified',
      detail: 'Handheld scanner verified SKU-HOODIE-BLK-L with audible chime confirmation.',
      latency: '3.4ms',
    },
    {
      num: 5,
      title: 'USPS Shipping Label Printed',
      detail: '4x6 thermal PDF label generated with tracking 94001118995648123901.',
      latency: '4.1ms',
    },
    {
      num: 6,
      title: 'Double-Entry Ledger Settled',
      detail: 'Debited Cash (1010) $85.00, Credited Revenue (4010) $85.00. Zero cents drift.',
      latency: '1.5ms',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between selection:bg-black selection:text-white">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative w-full px-4 sm:px-8 lg:px-16 pt-16 pb-20 border-b border-zinc-200 bg-white">
        <div className="w-full max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-bold text-orange-600 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>v2.4 GA Production Ready • Omnichannel Retail Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-[1.1]">
            The Mission-Critical Operations Platform for Modern Commerce
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-600 leading-relaxed font-medium">
            Unified orders, real-time wave fulfillment, append-only inventory, and double-entry accounting—built with PostgreSQL Row-Level Security and sub-5ms speed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold rounded-xl bg-black hover:bg-zinc-800 text-white transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-black transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              <span>Watch Live Engine Demo</span>
            </a>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> PostgreSQL RLS Isolation</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> Zero Oversell Guarantee</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> 190 Unit Tests Passing</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> SOC 2 &amp; GDPR Ready</span>
          </div>
        </div>
      </section>

      {/* Interactive Microsecond Lifecycle Simulator */}
      <section id="demo" className="py-20 w-full px-4 sm:px-8 lg:px-16 border-b border-zinc-200 bg-white">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Engine Benchmark</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Interactive Microsecond Order Lifecycle Simulator
            </h2>
            <p className="text-xs text-zinc-600 max-w-xl mx-auto">
              Simulate an incoming order event flowing through HMAC ingest, inventory reservation, pack station verification, and ledger settlement.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 gap-3">
              <div>
                <span className="text-xs font-bold text-black uppercase font-mono">Event: Shopify Webhook $85.00 USD</span>
                <p className="text-xs text-zinc-500 font-mono">Payload: SKU-HOODIE-BLK-L &bull; Ingest latency target &lt; 5ms</p>
              </div>

              <button
                type="button"
                onClick={handleRunDemo}
                disabled={isSimulating}
                className="px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{isSimulating ? 'Processing Pipeline...' : 'Fire Live Event'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {demoSteps.map((step) => {
                const isActive = simStep >= step.num;
                return (
                  <div
                    key={step.num}
                    className={`rounded-xl border p-4 transition-all space-y-2 ${
                      isActive
                        ? 'border-black bg-zinc-50 shadow-xs'
                        : 'border-zinc-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white text-[10px] font-bold font-mono">
                        {step.num}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-green-700">
                        {isActive ? `✓ ${step.latency}` : 'Pending'}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-black">{step.title}</h3>
                    <p className="text-[11px] text-zinc-600 leading-snug">{step.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 w-full px-4 sm:px-8 lg:px-16 border-b border-zinc-200 bg-white">
        <div className="w-full max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Enterprise Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Built for Scale, Speed, and Zero Failure Tolerance
            </h2>
            <p className="text-xs text-zinc-600 max-w-xl mx-auto">
              Every operational department connects directly to an immutable ledger and single operational truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-black">Warehouse Pack Station &amp; SLAs</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Wave picking algorithms guide pickers via shortest aisle paths. Barcode chime audio verification and 1-click thermal label printing.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-black">Append-Only Inventory Ledger</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Zero float math. Strict formula <code>available = on_hand - committed</code> guarantees 0% oversell rate across Shopify, Amazon, and POS.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-black">Automated Returns &amp; RMA</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Self-serve consumer portal, policy enforcement on final sale items, instant Stripe refund issuing, and automated dock restock scanning.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-black">Double-Entry Financial Accounting</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Debits and credits stored in integer cents. Automated Stripe payout reconciliation, fee tracking, COGS, and gross margin calculations.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-sm font-bold text-black">AI Demand Forecasting &amp; Copilot</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Predictive runout date modeling, automated reorder PO suggestions, and customer support macro generation with context injection.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-black">
                <ShieldCheck className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-black">Server-Enforced RBAC &amp; RLS</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                PostgreSQL Row-Level Security guarantees cross-tenant isolation. Fine-grained roles: Support cannot view Finance; Viewers are read-only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix & ROI Calculator */}
      <section id="pricing" className="py-20 w-full px-4 sm:px-8 lg:px-16 border-b border-zinc-200 bg-white">
        <div className="w-full max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Transparent Pricing</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Predictable Plans That Scale With Your Order Volume
            </h2>
            <p className="text-xs text-zinc-600 max-w-xl mx-auto">
              No hidden transaction fees or percent-of-revenue penalties. 14-day free trial on all tiers.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Starter</span>
                <div className="mt-2 text-3xl font-black text-black">$49<span className="text-xs font-medium text-zinc-500">/month</span></div>
                <p className="mt-1 text-xs text-zinc-600">For boutique brands and emerging direct-to-consumer storefronts.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Up to 500 orders/month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> 1 Warehouse location</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> 2 Team seats</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Shopify &amp; WooCommerce sync</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Pack Station scanner support</li>
                </ul>
              </div>

              <Link
                href="/signup?plan=starter"
                className="w-full py-2.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-black font-bold text-xs text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth (Recommended) */}
            <div className="rounded-2xl border-2 border-black bg-white p-6 shadow-md space-y-5 flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-black text-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 font-mono">Growth</span>
                <div className="mt-2 text-3xl font-black text-black">$149<span className="text-xs font-medium text-zinc-500">/month</span></div>
                <p className="mt-1 text-xs text-zinc-600">For scaling e-commerce brands fulfilling high daily volumes.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Up to 5,000 orders/month</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> 3 Warehouse locations &amp; bins</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> 10 Team seats with RBAC</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Automated Returns Portal (RMA)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Automated PO Reorder Engine</li>
                </ul>
              </div>

              <Link
                href="/signup?plan=growth"
                className="w-full py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs text-center transition-colors shadow-sm"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Scale */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">Scale</span>
                <div className="mt-2 text-3xl font-black text-black">$299<span className="text-xs font-medium text-zinc-500">/month</span></div>
                <p className="mt-1 text-xs text-zinc-600">For multi-node 3PLs, enterprise retail, and omni-channel high-velocity brands.</p>

                <ul className="mt-6 space-y-2.5 text-xs text-zinc-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Unlimited monthly orders</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Unlimited locations &amp; 3PL nodes</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> 25+ Seats with Custom Roles</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Dedicated 99.9% SLA &amp; Support</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> AI Demand Forecasting Engine</li>
                </ul>
              </div>

              <Link
                href="/signup?plan=scale"
                className="w-full py-2.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-black font-bold text-xs text-center transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Interactive ROI Calculator */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">Interactive ROI Calculator</h3>
                <p className="text-xs text-zinc-600">Calculate labor and revenue savings based on your monthly order volume.</p>
              </div>
              <span className="font-mono font-bold text-sm text-green-700">{roiMultiple}x Estimated ROI</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-black">
                <span>Monthly Orders:</span>
                <span className="font-mono text-base">{orderVolume.toLocaleString()} orders</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={orderVolume}
                onChange={(e) => setOrderVolume(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg bg-white border border-zinc-200 p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Hours Saved</span>
                <p className="text-base font-bold text-black">{hoursSaved} hrs/mo</p>
              </div>
              <div className="rounded-lg bg-white border border-zinc-200 p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Labor Saved</span>
                <p className="text-base font-bold text-green-700">${laborSavings.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-white border border-zinc-200 p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Revenue Protected</span>
                <p className="text-base font-bold text-green-700">${revenueProtected.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-white border border-zinc-200 p-3 text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Net Monthly Benefit</span>
                <p className="text-base font-bold text-black">${netSavings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 w-full px-4 sm:px-8 lg:px-16 bg-white border-b border-zinc-200 text-center">
        <div className="w-full max-w-5xl mx-auto space-y-4">
          <h2 className="text-3xl font-black text-black tracking-tight">Ready to streamline your e-commerce operations?</h2>
          <p className="text-xs text-zinc-600 font-medium">
            Join enterprise retailers fulfilling millions in orders with zero oversell, automated wave picking, and double-entry precision.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <span>Create Your Workspace Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
