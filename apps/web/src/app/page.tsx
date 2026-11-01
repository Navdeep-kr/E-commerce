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
  Zap
} from 'lucide-react';

export default function MarketingLandingPage() {
  const [orderVolume, setOrderVolume] = useState<number>(2500);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // ROI Math
  const planTier = orderVolume > 5000 ? 'Scale' : orderVolume > 500 ? 'Growth' : 'Starter';
  const planPrice = planTier === 'Scale' ? 399 : planTier === 'Growth' ? 149 : 49;
  const hoursSaved = Math.round((orderVolume * 1.5) / 60);
  const laborSavings = hoursSaved * 22;
  const revenueProtected = Math.round(orderVolume * 65 * 0.02);
  const netSavings = (laborSavings + revenueProtected) - planPrice;
  const roiMultiple = ((laborSavings + revenueProtected) / planPrice).toFixed(1);

  const handleRunDemo = () => {
    setIsSimulating(true);
    setSimStep(1);

    setTimeout(() => setSimStep(2), 200);
    setTimeout(() => setSimStep(3), 400);
    setTimeout(() => setSimStep(4), 600);
    setTimeout(() => setSimStep(5), 800);
    setTimeout(() => {
      setSimStep(6);
      setIsSimulating(false);
    }, 1000);
  };

  const demoSteps = [
    { num: 1, title: 'Shopify Webhook Ingested', detail: 'HMAC signature verified. $85.00 captured with integer minor units (8,500 cents).', latency: '1.2ms' },
    { num: 2, title: 'Append-Only Stock Hold', detail: 'available = on_hand - committed strictly updated (150 - 1 = 149). Zero oversell.', latency: '1.8ms' },
    { num: 3, title: 'Optimal Wave Pick Path', detail: 'Warehouse picker guided to Bin A-02-14 along the shortest aisle path.', latency: '0.9ms' },
    { num: 4, title: 'Pack Station Barcode Verified', detail: 'Handheld scanner verified SKU-HOODIE-BLK-L with audible chime confirmation.', latency: '3.4ms' },
    { num: 5, title: 'USPS Shipping Label Printed', detail: '4x6 thermal PDF label generated with tracking 9400100000000000000000.', latency: '4.1ms' },
    { num: 6, title: 'Double-Entry Ledger Settled', detail: 'Debited Cash (1010) $85.00, Credited Revenue (4010) $85.00. Zero cents drift.', latency: '1.5ms' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Storefront Ops</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v2.4 GA
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing &amp; ROI</a>
            <Link href="/acme-corp/help" className="hover:text-white transition-colors">Documentation</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/acme-corp/orders"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <a
              href="#demo"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              Test Live Sandbox <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section (10-Second Comprehension) */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          The Multi-Tenant Operations Platform for E-Commerce
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Fulfillment, Inventory &amp; Finance <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            With Zero Dropped Orders
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Unite warehouse wave picking, append-only inventory ledgers, omnichannel customer support, and double-entry accounting into one ultra-fast command center. Built with strict 64-bit integer money and multi-tenant Row-Level Security.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="#demo"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Try Sandbox Demo (No Signup Required)
          </a>
          <Link
            href="/acme-corp/help"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Read Operator Guides
          </Link>
        </div>

        {/* Proof Vitals Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-800/60 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Integer Precision</div>
            <div className="text-xl font-bold text-white mt-1">Zero Floats</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Strict minor-unit cents</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Stock Invariant</div>
            <div className="text-xl font-bold text-white mt-1">Append-Only</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">available = on_hand - committed</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">API Throughput</div>
            <div className="text-xl font-bold text-white mt-1">&lt; 20ms p95</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Cursor-based pagination</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium">Tenant Isolation</div>
            <div className="text-xl font-bold text-white mt-1">100% RLS</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">PostgreSQL boundary guards</div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Demo Section */}
      <section id="demo" className="py-16 px-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">Live Simulation</span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Interactive Flash Sale Sandbox
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test how Storefront Ops handles a real customer purchase from order intake to physical pack station in milliseconds.
            </p>
          </div>

          <button
            onClick={handleRunDemo}
            disabled={isSimulating}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              isSimulating
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer'
            }`}
          >
            {isSimulating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            {isSimulating ? 'Simulating Pipeline...' : 'Run Live Order Simulation'}
          </button>
        </div>

        {/* Live Terminal Sandbox Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-slate-200">
                SANDBOX EVENT PIPELINE: ORDER #ord_demo_88192
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> READY (0 Signup Required)
            </span>
          </div>

          {/* Interactive Steps Progression */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoSteps.map((step) => {
              const isActive = simStep >= step.num;
              return (
                <div
                  key={step.num}
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                    isActive
                      ? 'bg-slate-950/80 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-950/30 border-slate-800/60 opacity-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step.num}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{step.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{step.latency}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pipeline Invariant Verification:</span>
              <span className="font-mono text-emerald-400 font-bold">100% PASS (Zero Cents Drift, Zero Dropped Orders)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Execution time: 12.9ms total</span>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing & ROI Calculator */}
      <section id="pricing" className="py-16 px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">Transparent SaaS Pricing</span>
          <h2 className="text-3xl font-extrabold text-white">Interactive Pricing &amp; ROI Calculator</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Drag the slider to your expected monthly order volume to see your recommended tier and estimated labor &amp; stockout savings.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-8">
          {/* Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Order Volume:</span>
              <span className="text-2xl font-black text-indigo-400 font-mono">
                {orderVolume.toLocaleString()} orders/mo
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="15000"
              step="100"
              value={orderVolume}
              onChange={(e) => setOrderVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>200 (Starter)</span>
              <span>2,500 (Growth)</span>
              <span>15,000+ (Scale)</span>
            </div>
          </div>

          {/* Pricing & ROI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Recommended Tier</span>
              <div className="text-3xl font-black text-white">{planTier} Plan</div>
              <div className="text-2xl font-bold text-indigo-400 font-mono">${planPrice}<span className="text-xs font-normal text-slate-400">/mo</span></div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Includes all core modules, unlimited SKU catalog, and webhook integrations.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Time &amp; Labor Savings</span>
              <div className="text-3xl font-black text-emerald-400 font-mono">~{hoursSaved} hrs</div>
              <div className="text-lg font-bold text-slate-200 font-mono">${laborSavings.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo saved</span></div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Saved via optimized warehouse pick paths, barcode scan verification, and thermal auto-print.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2 shadow-lg shadow-indigo-500/5">
              <span className="text-xs font-bold text-indigo-400 uppercase">Estimated Net Monthly ROI</span>
              <div className="text-3xl font-black text-white font-mono">${netSavings.toLocaleString()}</div>
              <div className="text-lg font-bold text-indigo-400 font-mono">{roiMultiple}x ROI Multiple</div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Net profit added after paying the ${planPrice}/mo subscription fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-300">Storefront Ops</span>
            <span>&copy; 2026 Storefront Ops Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/acme-corp/help" className="hover:text-slate-300 transition-colors">Operator Guides</Link>
            <Link href="/acme-corp/settings/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/acme-corp/settings/observability" className="hover:text-slate-300 transition-colors">System Uptime</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
