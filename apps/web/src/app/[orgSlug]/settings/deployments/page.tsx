'use client';

import React, { useState } from 'react';
import {
  GitCommit,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Server,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Cpu,
  Layers,
  Terminal,
  Clock
} from 'lucide-react';

interface DeploymentLog {
  timestamp: string;
  slot: string;
  message: string;
  type: 'info' | 'warn' | 'success' | 'rollback';
}

export default function DeploymentsPage({ params }: { params: { orgSlug: string } }) {
  const orgSlug = params?.orgSlug || 'acme-corp';

  const [activeSlot, setActiveSlot] = useState<'blue' | 'green'>('blue');
  const [canaryPercent, setCanaryPercent] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [logs, setLogs] = useState<DeploymentLog[]>([
    { timestamp: '14:20:00', slot: 'SYSTEM', message: 'Current active production slot: BLUE (v2.4.0). GREEN is standby.', type: 'info' },
    { timestamp: '14:22:15', slot: 'DB-ENGINE', message: 'Database schema: Expand phase verified. 0 breaking DDL detected.', type: 'success' },
  ]);

  const handleRunCanary = (percent: number) => {
    setIsDeploying(true);
    setCanaryPercent(percent);

    setTimeout(() => {
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          slot: 'CANARY',
          message: `Shifted ${percent}% of live customer traffic to GREEN (v2.4.1-rc). Synthetic health probes passing.`,
          type: 'info'
        },
        ...prev
      ]);
      setIsDeploying(false);
    }, 400);
  };

  const handleFullCutover = () => {
    setIsDeploying(true);
    setCanaryPercent(100);

    setTimeout(() => {
      const nextActive = activeSlot === 'blue' ? 'green' : 'blue';
      setActiveSlot(nextActive);
      setCanaryPercent(0);
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          slot: 'DEPLOYER',
          message: `Zero-downtime cutover complete! 100% traffic shifted to ${nextActive.toUpperCase()} (v2.4.1). Zero dropped requests.`,
          type: 'success'
        },
        ...prev
      ]);
      setIsDeploying(false);
    }, 500);
  };

  const handleEmergencyRollback = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setCanaryPercent(0);
      setLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          slot: 'CIRCUIT-BREAKER',
          message: `EMERGENCY ROLLBACK TRIGGERED: Shifted 100% traffic back to ${activeSlot.toUpperCase()} baseline. 0 customer transactions impacted.`,
          type: 'rollback'
        },
        ...prev
      ]);
      setIsDeploying(false);
    }, 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Release & Zero-Downtime Deployments
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold border border-blue-300 dark:border-blue-800">
                  SLOT: {activeSlot.toUpperCase()} ACTIVE
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Blue/Green canary orchestrator, expand-contract database migrations, and instant automated rollbacks for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEmergencyRollback}
            disabled={isDeploying || canaryPercent === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              canaryPercent > 0
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm cursor-pointer'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Instant Rollback
          </button>
        </div>
      </div>

      {/* Cluster Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Blue Slot */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            activeSlot === 'blue'
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-sm'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${activeSlot === 'blue' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-bold text-sm text-gray-900 dark:text-white">Blue Cluster Slot</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                activeSlot === 'blue'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {activeSlot === 'blue' ? `${100 - canaryPercent}% TRAFFIC` : 'STANDBY'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Release Version:</span>
              <span className="font-mono font-medium">v2.4.0 (commit #26f2a98)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">p95 Latency:</span>
              <span className="font-medium text-emerald-600">18.2ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Error Rate:</span>
              <span className="font-medium text-emerald-600">0.00%</span>
            </div>
          </div>
        </div>

        {/* Green Slot */}
        <div
          className={`p-5 rounded-xl border transition-all ${
            activeSlot === 'green'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-sm'
              : canaryPercent > 0
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-sm'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${activeSlot === 'green' ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="font-bold text-sm text-gray-900 dark:text-white">Green Cluster Slot</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                activeSlot === 'green'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : canaryPercent > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {activeSlot === 'green' ? '100% TRAFFIC' : canaryPercent > 0 ? `${canaryPercent}% CANARY` : 'STANDBY'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Release Version:</span>
              <span className="font-mono font-medium">v2.4.1-rc (commit #HEAD)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">p95 Latency:</span>
              <span className="font-medium text-emerald-600">16.8ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Canary Health:</span>
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            </div>
          </div>
        </div>

        {/* Database Migration Status */}
        <div className="p-5 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-sm text-gray-900 dark:text-white">Expand-Contract DB State</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              EXPAND SAFE
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Phase:</span>
              <span className="font-medium text-purple-600">Phase 1 (Expand)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dual-Write Ingress:</span>
              <span className="font-medium text-emerald-600">Active (0 lockups)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Breaking DDL Check:</span>
              <span className="font-medium text-emerald-600">Passed (6/6 files)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canary Traffic Routing Station */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Canary Traffic Progression
              <span className="text-xs text-gray-400 font-normal">
                (Shift real customer requests safely between clusters)
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Test release candidate with live traffic fractions before full cutover. Zero in-flight orders are dropped.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunCanary(10)}
              disabled={isDeploying}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                canaryPercent === 10
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              10% Canary
            </button>
            <button
              onClick={() => handleRunCanary(50)}
              disabled={isDeploying}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                canaryPercent === 50
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              50% Canary
            </button>
            <button
              onClick={handleFullCutover}
              disabled={isDeploying}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              100% Full Cutover
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
            <span>{activeSlot.toUpperCase()} (Active Baseline): {100 - canaryPercent}%</span>
            <span>{activeSlot === 'blue' ? 'GREEN' : 'BLUE'} (Release Candidate): {canaryPercent}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${100 - canaryPercent}%` }}
            />
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${canaryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Deployment & Orchestration Console Trace */}
      <div className="bg-gray-950 text-gray-200 rounded-xl p-5 font-mono text-xs space-y-3 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Zero-Downtime Deployment Log Stream</span>
          </div>
          <span className="text-gray-400 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Live Pipeline Telemetry
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={`px-1.5 py-0.2 rounded font-semibold text-[10px] shrink-0 ${
                  log.type === 'success'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : log.type === 'rollback'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'bg-blue-950 text-blue-400 border border-blue-800'
                }`}
              >
                {log.slot}
              </span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-emerald-300'
                    : log.type === 'rollback'
                    ? 'text-red-300 font-semibold'
                    : 'text-gray-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
