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

  const [activeSlot, setActiveSlot] = useState<'primary' | 'canary'>('primary');
  const [canaryPercent, setCanaryPercent] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [logs, setLogs] = useState<DeploymentLog[]>([
    { timestamp: '14:20:00', slot: 'SYSTEM', message: 'Current active production slot: PRIMARY (v2.4.0). STANDBY is ready.', type: 'info' },
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
          message: `Shifted ${percent}% of live customer traffic to STANDBY (v2.4.1-rc). Synthetic health probes passing.`,
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
      const nextActive = activeSlot === 'primary' ? 'canary' : 'primary';
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-zinc-200 text-black rounded-xl shadow-xs">
              <Rocket className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                Release & Zero-Downtime Deployments
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-green-700 font-bold border border-green-300">
                  SLOT: {activeSlot.toUpperCase()} ACTIVE
                </span>
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                Zero-downtime canary orchestrator, expand-contract database migrations, and instant automated rollbacks for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEmergencyRollback}
            disabled={isDeploying || canaryPercent === 0}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-xs ${
              canaryPercent > 0
                ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Instant Rollback
          </button>
        </div>
      </div>

      {/* Cluster Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Slot */}
        <div
          className={`p-5 rounded-xl border transition-all bg-white shadow-sm ${
            activeSlot === 'primary'
              ? 'border-2 border-black'
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${activeSlot === 'primary' ? 'text-black' : 'text-zinc-400'}`} />
              <span className="font-bold text-sm text-black">Primary Cluster Slot</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white border ${
                activeSlot === 'primary'
                  ? 'border-black text-black'
                  : 'border-zinc-200 text-zinc-500'
              }`}
            >
              {activeSlot === 'primary' ? `${100 - canaryPercent}% TRAFFIC` : 'STANDBY'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-500">Release Version:</span>
              <span className="font-mono font-bold text-black">v2.4.0 (commit #26f2a98)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">p95 Latency:</span>
              <span className="font-bold text-green-700">18.2ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Error Rate:</span>
              <span className="font-bold text-green-700">0.00%</span>
            </div>
          </div>
        </div>

        {/* Standby / Canary Slot */}
        <div
          className={`p-5 rounded-xl border transition-all bg-white shadow-sm ${
            activeSlot === 'canary'
              ? 'border-2 border-green-600'
              : canaryPercent > 0
              ? 'border-2 border-orange-400'
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className={`w-5 h-5 ${activeSlot === 'canary' ? 'text-green-600' : 'text-zinc-400'}`} />
              <span className="font-bold text-sm text-black">Canary Cluster Slot</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white border ${
                activeSlot === 'canary'
                  ? 'border-green-300 text-green-700'
                  : canaryPercent > 0
                  ? 'border-orange-300 text-orange-600'
                  : 'border-zinc-200 text-zinc-500'
              }`}
            >
              {activeSlot === 'canary' ? '100% TRAFFIC' : canaryPercent > 0 ? `${canaryPercent}% CANARY` : 'STANDBY'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-500">Release Version:</span>
              <span className="font-mono font-bold text-black">v2.4.1-rc (commit #HEAD)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">p95 Latency:</span>
              <span className="font-bold text-green-700">16.8ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Canary Health:</span>
              <span className="font-bold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" /> Healthy
              </span>
            </div>
          </div>
        </div>

        {/* Database Migration Status */}
        <div className="p-5 rounded-xl border bg-white border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-black" />
              <span className="font-bold text-sm text-black">Expand-Contract DB State</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white text-green-700 border border-green-300">
              EXPAND SAFE
            </span>
          </div>

          <div className="mt-4 space-y-2 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span className="text-zinc-500">Current Phase:</span>
              <span className="font-bold text-black">Phase 1 (Expand)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Dual-Write Ingress:</span>
              <span className="font-bold text-green-700">Active (0 lockups)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Breaking DDL Check:</span>
              <span className="font-bold text-green-700">Passed (6/6 files)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canary Traffic Routing Station */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              Canary Traffic Progression
              <span className="text-xs text-zinc-500 font-normal">
                (Shift real customer requests safely between clusters)
              </span>
            </h2>
            <p className="text-xs text-zinc-600 mt-1">
              Test release candidate with live traffic fractions before full cutover. Zero in-flight orders are dropped.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunCanary(10)}
              disabled={isDeploying}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                canaryPercent === 10
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-black border-zinc-300 hover:border-black'
              }`}
            >
              10% Canary
            </button>
            <button
              onClick={() => handleRunCanary(50)}
              disabled={isDeploying}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                canaryPercent === 50
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-black border-zinc-300 hover:border-black'
              }`}
            >
              50% Canary
            </button>
            <button
              onClick={handleFullCutover}
              disabled={isDeploying}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              100% Full Cutover
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-zinc-600">
            <span>PRIMARY (Active Baseline): {100 - canaryPercent}%</span>
            <span>CANARY (Release Candidate): {canaryPercent}%</span>
          </div>
          <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${100 - canaryPercent}%` }}
            />
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: `${canaryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Deployment & Orchestration Console Trace */}
      <div className="bg-white text-black rounded-xl p-5 font-mono text-xs space-y-3 border border-zinc-300 shadow-md">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-700" />
            <span className="font-bold text-black">Zero-Downtime Deployment Log Stream</span>
          </div>
          <span className="text-zinc-500 text-[11px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3" /> Live Pipeline Telemetry
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-zinc-500 shrink-0">[{log.timestamp}]</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[10px] shrink-0 border ${
                  log.type === 'success'
                    ? 'bg-white text-green-700 border-green-300'
                    : log.type === 'rollback'
                    ? 'bg-white text-red-600 border-red-300'
                    : 'bg-white text-black border-zinc-300'
                }`}
              >
                {log.slot}
              </span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-green-700 font-semibold'
                    : log.type === 'rollback'
                    ? 'text-red-600 font-bold'
                    : 'text-zinc-700 font-normal'
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
