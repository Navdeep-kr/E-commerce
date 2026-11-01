'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Check,
  BarChart3,
  Globe,
  Truck,
  Cpu
} from 'lucide-react';

export default function GrowthDashboardPage({ params }: { params: { orgSlug: string } }) {
  const orgSlug = params?.orgSlug || 'acme-corp';

  const [activeTab, setActiveTab] = useState<'metrics' | 'rhythm' | 'roadmap'>('metrics');

  const roadmapMilestones = [
    {
      quarter: 'Q1',
      title: 'Autonomous AI Operations & Predictive Logistics',
      status: 'IN PROGRESS',
      icon: Sparkles,
      deliverables: [
        'Autonomous warehouse dispatch balancing pick waves by carrier cut-offs',
        'Intelligent restock PO automation with vendor confirmation loop',
        'Real-time voice & chat support copilot with instant RMA generation'
      ]
    },
    {
      quarter: 'Q2',
      title: 'Cross-Border Commerce & Global Customs Routing',
      status: 'PLANNED',
      icon: Globe,
      deliverables: [
        'AI Harmonized System (HS) code classification for catalog exports',
        'Multi-currency landed cost FX locking across 180 global currencies',
        'Decoupled carrier mesh: DHL Express, DPD, Royal Mail, Australia Post'
      ]
    },
    {
      quarter: 'Q3',
      title: 'Multi-Node Edge Warehouses & 3PL Network',
      status: 'PLANNED',
      icon: Truck,
      deliverables: [
        'Distributed inventory order routing to closest geographic facility',
        'B2B Wholesale portal with tiered price sheets and credit terms',
        'Offline-first SQLite edge syncing for mobile warehouse pick carts'
      ]
    },
    {
      quarter: 'Q4',
      title: 'Headless Omnichannel POS & Retail Mesh',
      status: 'PLANNED',
      icon: Cpu,
      deliverables: [
        'In-store retail POS checkout unified with digital warehouse inventory',
        'End-to-end serialized lot tracking with cryptographic chain of custody',
        'Enterprise Custom Automation Studio with sandboxed WebAssembly'
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-zinc-200 text-black rounded-xl shadow-xs">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                Post-Launch Operations &amp; Growth Cockpit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-green-700 font-bold border border-green-300">
                  HEALTHY TRACTION
                </span>
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                Executive business vitals, operating cadences, and multi-quarter innovation roadmap for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-zinc-200 shadow-xs">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'metrics'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            SaaS &amp; Ops Vitals
          </button>
          <button
            onClick={() => setActiveTab('rhythm')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'rhythm'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Operating Rhythm
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'roadmap'
                ? 'bg-black text-white shadow-xs'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            Q1–Q4 Roadmap
          </button>
        </div>
      </div>

      {/* METRICS TAB */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          {/* Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="text-xs text-zinc-600 font-bold uppercase flex items-center justify-between">
                <span>Contracted MRR</span>
                <DollarSign className="w-4 h-4 text-green-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-black">$14,601.00</div>
              <div className="mt-1 text-xs text-green-700 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> +18.4% MoM Growth
              </div>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="text-xs text-zinc-600 font-bold uppercase flex items-center justify-between">
                <span>Annual Run Rate (ARR)</span>
                <BarChart3 className="w-4 h-4 text-black" />
              </div>
              <div className="mt-2 text-2xl font-bold text-black">$175,212.00</div>
              <div className="mt-1 text-xs text-green-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" /> Exact 12x MRR
              </div>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="text-xs text-zinc-600 font-bold uppercase flex items-center justify-between">
                <span>Gross Churn Rate</span>
                <Activity className="w-4 h-4 text-black" />
              </div>
              <div className="mt-2 text-2xl font-bold text-black">1.0%</div>
              <div className="mt-1 text-xs text-green-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" /> 99.0% Retention
              </div>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="text-xs text-zinc-600 font-bold uppercase flex items-center justify-between">
                <span>LTV : CAC Multiple</span>
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-black">4.8x</div>
              <div className="mt-1 text-xs text-green-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" /> Target &ge; 3.0x
              </div>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <div className="text-xs text-zinc-600 font-bold uppercase flex items-center justify-between">
                <span>Net Revenue Retention</span>
                <TrendingUp className="w-4 h-4 text-green-700" />
              </div>
              <div className="mt-2 text-2xl font-bold text-black">114%</div>
              <div className="mt-1 text-xs text-green-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" /> Expansion Outpaces Churn
              </div>
            </div>
          </div>

          {/* Operational Quality Vitals */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-black">
              Platform Operational Fidelity Benchmarks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
                <div className="text-xs text-zinc-500 font-bold uppercase">Platform Orders Processed</div>
                <div className="text-xl font-bold text-black mt-1">1,485,000</div>
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">0 Dropped Orders</div>
              </div>

              <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
                <div className="text-xs text-zinc-500 font-bold uppercase">Inventory Stock Accuracy</div>
                <div className="text-xl font-bold text-black mt-1">99.98%</div>
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">Append-only ledger verified</div>
              </div>

              <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
                <div className="text-xs text-zinc-500 font-bold uppercase">WAU / MAU Stickiness</div>
                <div className="text-xl font-bold text-black mt-1">79%</div>
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">Daily operational habituation</div>
              </div>

              <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
                <div className="text-xs text-zinc-500 font-bold uppercase">Fulfillment SLA Compliance</div>
                <div className="text-xl font-bold text-black mt-1">99.4%</div>
                <div className="text-[11px] text-green-700 font-semibold mt-0.5">Dispatched within cutoff window</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPERATING RHYTHM TAB */}
      {activeTab === 'rhythm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  <h3 className="font-bold text-sm text-black">Daily Standup (15m)</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500 font-bold">09:00 UTC</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Review P0/P1 alerts &amp; incident runbooks from past 24h</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Verify Inngest background queue lag &lt; 10s and zero DLQ backlogs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Review warehouse barcode scanner round-trip latencies (&lt; 50ms)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Triage urgent support tickets within first response SLA window</span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <h3 className="font-bold text-sm text-black">Weekly Review (45m)</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500 font-bold">Mondays 14:00</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Infrastructure capacity audit (DB pool &lt; 65%, Redis hit ratio &gt; 85%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Merchant health score review &amp; proactive churn mitigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Automated tenant fuzzing reports &amp; privacy deletion SLA checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Sprint backlog grooming and high-impact feature prioritization</span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <h3 className="font-bold text-sm text-black">Monthly Board (60m)</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500 font-bold">1st Business Day</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Reconcile MRR/ARR against Stripe payouts down to exact cent</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Unit economics audit: LTV to CAC multiple (&ge; 3.0x target)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Net Revenue Retention assessment (&gt; 110% target)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>Review milestone execution against multi-quarter product roadmap</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ROADMAP TAB */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmapMilestones.map((m) => {
              const IconComp = m.icon;
              return (
                <div
                  key={m.quarter}
                  className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white border border-zinc-200 text-black rounded-lg shadow-xs">
                        <IconComp className="w-4 h-4 text-black" />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-600">{m.quarter} HORIZON</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white border ${
                        m.status === 'IN PROGRESS'
                          ? 'border-orange-300 text-orange-600'
                          : 'border-zinc-200 text-zinc-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-black">{m.title}</h3>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                    {m.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
