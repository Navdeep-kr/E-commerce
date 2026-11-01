'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Clock,
  Sparkles,
  Tag,
  Bell,
  Lock,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  AutomationEngine,
  type AutomationRule,
  type ExecutionLog,
} from '@storefront-ops/core';

export default function AutomationsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'rules' | 'recipes' | 'logs'>('rules');
  const [activeRules, setActiveRules] = useState<AutomationRule[]>([]);
  const [recipes, setRecipes] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayBanner, setReplayBanner] = useState<{
    message: string;
    isDuplicateSkipped: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesRes, logsRes] = await Promise.all([
          fetch('/api/automations/rules'),
          fetch('/api/automations/logs'),
        ]);
        const rulesData = await rulesRes.json();
        const logsData = await logsRes.json();

        if (rulesData.activeRules) setActiveRules(rulesData.activeRules);
        if (rulesData.recipes) setRecipes(rulesData.recipes);
        if (logsData.logs) setLogs(logsData.logs);
      } catch {
        // Fallback
      }
    };
    fetchData();
  }, []);

  const handleInstallRecipe = async (recipeId: string) => {
    try {
      const res = await fetch('/api/automations/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveRules((prev) => [data.rule, ...prev]);
        showToast(data.message);
        setActiveTab('rules');
      } else {
        showToast(data.error || 'Failed to install recipe.');
      }
    } catch {
      showToast('Network error installing recipe.');
    }
  };

  const handleTestReplay = async () => {
    setIsReplaying(true);
    setReplayBanner(null);

    try {
      const res = await fetch('/api/automations/logs', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplayBanner({
          message: data.message,
          isDuplicateSkipped: data.isDuplicateSkipped,
        });
        setLogs((prev) => [data.log, ...prev]);
        showToast(data.isDuplicateSkipped ? 'Duplicate event safely skipped!' : 'Event processed.');
      } else {
        showToast(data.error || 'Replay simulation failed.');
      }
    } catch {
      showToast('Network error during replay.');
    } finally {
      setIsReplaying(false);
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
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Automation & Workflows</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              Idempotent Engine (Loop Prevention)
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Workflow Automations</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Event triggers, condition matching, 15 prebuilt operational recipes, and idempotent execution logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('recipes')}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-950/40 hover:bg-amber-500 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Browse 15 Prebuilt Recipes</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Rules"
          value={String(activeRules.length)}
          description="Monitoring operational events"
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="Executions Today"
          value="142"
          trend={{ value: 24, isPositive: true }}
          description="Triggered actions completed"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Duplicates Prevented"
          value="18"
          description="Idempotent replay guards"
          icon={<ShieldCheck className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Infinite Loops Stopped"
          value="0"
          description="Max recursion depth &le; 3 enforced"
          icon={<RotateCcw className="h-5 w-5 text-rose-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rules'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Active Rules ({activeRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'recipes'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>15 Prebuilt Recipes</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Execution Run Logs & Replay Simulator</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-mono">
            {logs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Active Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {activeRules.map((rule) => (
              <div key={rule.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-100">{rule.name}</h3>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 border border-emerald-500/20 font-bold uppercase">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{rule.description}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                    <span className="font-mono text-[11px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-amber-300">
                      WHEN: {rule.trigger}
                    </span>
                    {rule.conditions.length > 0 && (
                      <span className="font-mono text-[11px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                        IF: {rule.conditions.map((c) => `${c.field} ${c.operator} ${c.value}`).join(' AND ')}
                      </span>
                    )}
                    <span className="font-mono text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                      THEN: {rule.actions.map((a) => a.type).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`Simulated test trigger for ${rule.name}`)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                  >
                    <Play className="h-3 w-3" />
                    <span>Test Rule</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: 15 Prebuilt Recipes */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-zinc-800 font-mono text-[10px] text-zinc-400 px-2 py-0.5">
                    {recipe.id}
                  </span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    {recipe.trigger}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mt-2">{recipe.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{recipe.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-indigo-400 font-mono">
                  {recipe.actions.map((a) => a.type).join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => handleInstallRecipe(recipe.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Execution Run Logs & Idempotency Replay Simulator */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Replay Simulation Banner */}
          <div className="rounded-xl border border-indigo-500/30 bg-zinc-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-100">Step 13 Idempotency & Replay Simulator</h3>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Demonstrates that replaying a low-stock event creates <span className="font-bold text-white">exactly one</span> reorder task, and all subsequent replays are safely deduplicated.
              </p>
            </div>

            <button
              type="button"
              disabled={isReplaying}
              onClick={handleTestReplay}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isReplaying ? 'Simulating...' : 'Test Replay Low-Stock Event'}</span>
            </button>
          </div>

          {replayBanner && (
            <div
              className={`rounded-xl border p-4 flex items-center gap-3 ${
                replayBanner.isDuplicateSkipped
                  ? 'border-indigo-500/50 bg-indigo-950/30 text-indigo-200'
                  : 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
              }`}
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-bold">{replayBanner.isDuplicateSkipped ? 'IDEMPOTENCY DEDUPLICATION SUCCESS' : 'EVENT EXECUTED'}</p>
                <p className="mt-0.5">{replayBanner.message}</p>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message / Action</th>
                  <th className="py-3 px-4 text-right">Deduplication Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {new Date(log.timestampIso).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-100">{log.ruleName}</td>
                    <td className="py-3.5 px-4">
                      {log.status === 'success' ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                          Executed (1 Task)
                        </span>
                      ) : log.status === 'skipped_duplicate' ? (
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-bold text-indigo-400 border border-indigo-500/20">
                          Skipped (Idempotent)
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                          {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 max-w-sm truncate">{log.message}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-zinc-500">
                      {log.deduplicationKey}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
