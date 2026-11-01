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
      color: 'indigo',
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
      color: 'blue',
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
      color: 'purple',
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
      color: 'emerald',
      deliverables: [
        'In-store retail POS checkout unified with digital warehouse inventory',
        'End-to-end serialized lot tracking with cryptographic chain of custody',
        'Enterprise Custom Automation Studio with sandboxed WebAssembly'
      ]
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Post-Launch Operations &amp; Growth Cockpit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
                  HEALTHY TRACTION
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Executive business vitals, operating cadences, and multi-quarter innovation roadmap for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'metrics'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            SaaS &amp; Ops Vitals
          </button>
          <button
            onClick={() => setActiveTab('rhythm')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'rhythm'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Operating Rhythm
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'roadmap'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Contracted MRR</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">$14,601.00</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% MoM Growth
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Annual Run Rate (ARR)</span>
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">$175,212.00</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Exact 12x MRR
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Gross Churn Rate</span>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">1.0%</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> 99.0% Retention
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>LTV : CAC Multiple</span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">4.8x</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target &ge; 3.0x
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Net Revenue Retention</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">114%</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Expansion Outpaces Churn
              </div>
            </div>
          </div>

          {/* Operational Quality Vitals */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Platform Operational Fidelity Benchmarks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-xs text-gray-500">Platform Orders Processed</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">1,485,000</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">0 Dropped Orders</div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-xs text-gray-500">Inventory Stock Accuracy</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">99.98%</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Append-only ledger verified</div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-xs text-gray-500">WAU / MAU Stickiness</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">79%</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Daily operational habituation</div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-xs text-gray-500">Fulfillment SLA Compliance</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">99.4%</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Dispatched within cutoff window</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPERATING RHYTHM TAB */}
      {activeTab === 'rhythm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Daily Standup (15m)</h3>
                </div>
                <span className="text-xs font-mono text-gray-400">09:00 UTC</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Review P0/P1 alerts &amp; incident runbooks from past 24h</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Verify Inngest background queue lag &lt; 10s and zero DLQ backlogs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Review warehouse barcode scanner round-trip latencies (&lt; 50ms)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Triage urgent support tickets within first response SLA window</span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Weekly Review (45m)</h3>
                </div>
                <span className="text-xs font-mono text-gray-400">Mondays 14:00</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Infrastructure capacity audit (DB pool &lt; 65%, Redis hit ratio &gt; 85%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Merchant health score review &amp; proactive churn mitigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Automated tenant fuzzing reports &amp; privacy deletion SLA checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Sprint backlog grooming and high-impact feature prioritization</span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Monthly Board (60m)</h3>
                </div>
                <span className="text-xs font-mono text-gray-400">1st Business Day</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Reconcile MRR/ARR against Stripe payouts down to exact cent</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Unit economics audit: LTV to CAC multiple (&ge; 3.0x target)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Net Revenue Retention assessment (&gt; 110% target)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
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
                  className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-500">{m.quarter} HORIZON</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        m.status === 'IN PROGRESS'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{m.title}</h3>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
                    {m.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
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
