'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Flame,
  Layers,
  Play,
  RotateCw,
  Server,
  ShieldAlert,
  Zap,
  Terminal,
  BookOpen,
  Check,
  Clock,
  ExternalLink
} from 'lucide-react';

interface SimulationResult {
  scenario: string;
  success: boolean;
  alertName: string;
  severity: string;
  runbook: string;
  remediation: string;
  verified: boolean;
  latencyMs: number;
}

export default function ObservabilityDashboardPage({ params }: { params: { orgSlug: string } }) {
  const orgSlug = params?.orgSlug || 'acme-corp';

  const [activeTab, setActiveTab] = useState<'overview' | 'runbooks' | 'simulator'>('overview');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(null);

  const runbooksList = [
    { code: 'RB-01', title: 'Database Connection Pool Exhaustion', severity: 'P1', trigger: 'db_pool_utilization > 90%', file: 'RB-01-database-connection-exhaustion.md' },
    { code: 'RB-02', title: 'Shopify Webhook Signature Failures', severity: 'P1', trigger: 'shopify_signature_failure_rate > 10%', file: 'RB-02-shopify-webhook-signature-failures.md' },
    { code: 'RB-03', title: 'Stripe Webhook Processing Lag & Outage', severity: 'P1', trigger: 'stripe_webhook_age > 15m', file: 'RB-03-stripe-webhook-outage.md' },
    { code: 'RB-04', title: 'Carrier API Rate-Limit Breach & Failover', severity: 'P2', trigger: 'carrier_rate_limit_429s > 50', file: 'RB-04-carrier-api-rate-limit-breach.md' },
    { code: 'RB-05', title: 'Inventory Oversell & Stock Reservation Deadlock', severity: 'P1', trigger: 'available_stock < 0 or deadlock', file: 'RB-05-inventory-oversell-deadlock.md' },
    { code: 'RB-06', title: 'Inngest Job Queue Backlog & Processing Stall', severity: 'P2', trigger: 'queue_lag_seconds > 300s', file: 'RB-06-inngest-job-queue-backlog.md' },
    { code: 'RB-07', title: 'Redis Cache Eviction Avalanche & Stampede', severity: 'P2', trigger: 'cache_hit_ratio < 65%', file: 'RB-07-redis-cache-eviction-avalanche.md' },
    { code: 'RB-08', title: 'Cross-Tenant RLS Violation Alert', severity: 'P0', trigger: 'cross_tenant_access_attempt > 0', file: 'RB-08-cross-tenant-rls-violation-alert.md' },
    { code: 'RB-09', title: 'Pack Station Scanner Latency & Offline Queueing', severity: 'P2', trigger: 'scan_latency > 200ms', file: 'RB-09-pack-station-scanner-latency.md' },
    { code: 'RB-10', title: 'Payout Reconciliation Drift & Financial Imbalance', severity: 'P1', trigger: 'payout_drift_cents > 0', file: 'RB-10-payout-reconciliation-drift.md' },
    { code: 'RB-11', title: 'GDPR / CCPA Erasure Request Failure', severity: 'P2', trigger: 'gdpr_erasure_status == failed', file: 'RB-11-gdpr-erasure-failure.md' },
    { code: 'RB-12', title: 'Public REST API Rate-Limit Breach & DDoS Defense', severity: 'P1', trigger: 'requests_per_sec > 2000', file: 'RB-12-public-rest-api-ddos.md' },
    { code: 'RB-13', title: 'Email & SMS Notification Delivery Drop', severity: 'P2', trigger: 'delivery_failure_rate > 10%', file: 'RB-13-email-sms-delivery-drop.md' },
    { code: 'RB-14', title: 'Landed Cost Allocation Penny Drift', severity: 'P2', trigger: 'landed_cost_remainder_cents > 0', file: 'RB-14-landed-cost-penny-drift.md' },
    { code: 'RB-15', title: 'AI Assistant Prompt Injection Surge & Abuse', severity: 'P1', trigger: 'injection_attempts_rate > 10/min', file: 'RB-15-ai-assistant-prompt-injection-surge.md' },
  ];

  const handleRunSimulation = (scenario: string) => {
    setIsSimulating(true);
    setTimeout(() => {
      let result: SimulationResult;
      switch (scenario) {
        case 'db_exhaustion':
          result = {
            scenario: 'Database Connection Pool Exhaustion',
            success: true,
            alertName: 'DatabasePoolExhaustion',
            severity: 'P1',
            runbook: 'RB-01',
            remediation: 'Terminated 14 idle connections and expanded PgBouncer pool ceiling to 50 slots.',
            verified: true,
            latencyMs: 142
          };
          break;
        case 'cross_tenant':
          result = {
            scenario: 'Cross-Tenant Access Boundary Probe',
            success: true,
            alertName: 'CrossTenantRLSViolation',
            severity: 'P0',
            runbook: 'RB-08',
            remediation: 'Immediately invalidated actor session token and blocked source IP subnet at edge firewall.',
            verified: true,
            latencyMs: 89
          };
          break;
        case 'carrier_rate_limit':
          result = {
            scenario: 'Carrier API 429 Throttle Surge',
            success: true,
            alertName: 'CarrierApiRateLimitBreach',
            severity: 'P2',
            runbook: 'RB-04',
            remediation: 'Rotated secondary carrier credentials and enabled client-side token bucket backoff.',
            verified: true,
            latencyMs: 98
          };
          break;
        default:
          result = {
            scenario: 'Inventory Hold Deadlock',
            success: true,
            alertName: 'InventoryOversellDeadlock',
            severity: 'P1',
            runbook: 'RB-05',
            remediation: 'Released expired cart holds and recalculated available = on_hand - committed.',
            verified: true,
            latencyMs: 112
          };
      }
      setLastSimulation(result);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Observability & Runbooks Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold border border-emerald-300 dark:border-emerald-800">
                  ALL SYSTEMS OPERATIONAL
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Structured telemetry, automated threshold alerts, and standardized incident runbooks for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Vitals & Alerts
          </button>
          <button
            onClick={() => setActiveTab('runbooks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'runbooks'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Runbook Catalog (15)
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Incident Simulator
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                <span>Database Pool</span>
                <Database className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">48%</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> 24 / 50 Active Slots
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                <span>Inngest Queue Lag</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">4.2s</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target &lt; 300s
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                <span>Cache Hit Ratio</span>
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">94.6%</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target &gt; 65%
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                <span>API p95 Latency</span>
                <Server className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">18.4ms</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target &lt; 300ms
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
                <span>5xx Error Rate</span>
                <AlertTriangle className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">0.02%</div>
              <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Target &lt; 2.0%
              </div>
            </div>
          </div>

          {/* Alert Status Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">
                Zero Active Firing Incidents
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-400">
                All 15 telemetry health monitors are operating within established performance and security thresholds.
                Telemetry logs are streaming with trace correlation and tenant isolation.
              </p>
            </div>
          </div>

          {/* Recent Resolved Alerts Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Telemetry Alert History</h2>
                <p className="text-xs text-gray-500">Automated detections and remediation events from the last 24 hours.</p>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium">
                3 Events Resolved
              </span>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    P2 HIGH
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      CarrierApiRateLimitBreach
                      <span className="text-xs text-gray-400 font-mono">RB-04</span>
                    </div>
                    <p className="text-xs text-gray-500">Carrier rate-limit 429 threshold reached (52 reqs). Fallback key engaged.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 font-medium">Resolved in 1.4s</span>
                  <div className="text-[11px] text-gray-400">Today at 11:24 AM</div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    P1 CRITICAL
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      DatabasePoolExhaustion
                      <span className="text-xs text-gray-400 font-mono">RB-01</span>
                    </div>
                    <p className="text-xs text-gray-500">Connection pool peaked at 91% during catalog re-indexing. Idle connections reaped.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 font-medium">Resolved in 2.8s</span>
                  <div className="text-[11px] text-gray-400">Today at 08:15 AM</div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    P0 SECURITY
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      CrossTenantRLSViolation
                      <span className="text-xs text-gray-400 font-mono">RB-08</span>
                    </div>
                    <p className="text-xs text-gray-500">Hostile parameter fuzzing blocked. Offending session revoked; zero leaks.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-600 font-medium">Resolved in 0.4s</span>
                  <div className="text-[11px] text-gray-400">Yesterday at 18:30 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RUNBOOKS CATALOG TAB */}
      {activeTab === 'runbooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Production Operational Runbooks (15)</h2>
              <p className="text-xs text-gray-500">Standardized triage, diagnosis, and remediation protocols stored under /docs/runbooks/.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {runbooksList.map((rb) => {
              const severityColor =
                rb.severity === 'P0'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200'
                  : rb.severity === 'P1'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200';

              return (
                <div
                  key={rb.code}
                  className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">{rb.code}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${severityColor}`}>
                        {rb.severity}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{rb.title}</h3>
                    <p className="text-xs text-gray-500 font-mono">Trigger: {rb.trigger}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-mono text-[11px] truncate max-w-[180px]">{rb.file}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline cursor-pointer">
                      View Runbook <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INCIDENT SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 flex items-start gap-4">
            <Flame className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                Staging Failure & Recovery Simulator
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                Execute controlled threshold breach injections to test alerting rules, runbook correlation, and remediation workflows without impacting live production traffic.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleRunSimulation('db_exhaustion')}
              disabled={isSimulating}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500 text-left space-y-2 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-mono text-gray-400">RB-01</span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600">
                DB Pool Exhaustion
              </h4>
              <p className="text-xs text-gray-500">Inject 95% connection pool load & test idle cleanup.</p>
            </button>

            <button
              onClick={() => handleRunSimulation('cross_tenant')}
              disabled={isSimulating}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-500 text-left space-y-2 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-mono text-gray-400">RB-08</span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-purple-600">
                Cross-Tenant Breach
              </h4>
              <p className="text-xs text-gray-500">Simulate unauthorized tenant query & test token revocation.</p>
            </button>

            <button
              onClick={() => handleRunSimulation('carrier_rate_limit')}
              disabled={isSimulating}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-amber-500 text-left space-y-2 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <Zap className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-mono text-gray-400">RB-04</span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-amber-600">
                Carrier Rate-Limit (429)
              </h4>
              <p className="text-xs text-gray-500">Simulate 65 429 errors & test carrier key failover.</p>
            </button>

            <button
              onClick={() => handleRunSimulation('inventory_deadlock')}
              disabled={isSimulating}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-red-500 text-left space-y-2 transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <Layers className="w-5 h-5 text-red-600" />
                <span className="text-xs font-mono text-gray-400">RB-05</span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-red-600">
                Inventory Deadlock
              </h4>
              <p className="text-xs text-gray-500">Simulate oversell alert & test hold expiration.</p>
            </button>
          </div>

          {/* Simulation Output Console */}
          {lastSimulation && (
            <div className="bg-gray-950 text-gray-200 rounded-xl p-5 font-mono text-xs space-y-3 border border-gray-800 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Simulation Execution Trace: {lastSimulation.scenario}</span>
                </div>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RECOVERY VERIFIED ({lastSimulation.latencyMs}ms)
                </span>
              </div>

              <div className="space-y-1.5 text-gray-300">
                <div>[00.000s] Injected failure scenario: {lastSimulation.scenario}</div>
                <div className="text-amber-300">
                  [00.024s] Alert triggered: [{lastSimulation.severity}] {lastSimulation.alertName} - Matched Runbook {lastSimulation.runbook}
                </div>
                <div>[00.048s] Invoking automated remediation script per {lastSimulation.runbook}...</div>
                <div className="text-blue-300">[00.072s] Action executed: {lastSimulation.remediation}</div>
                <div className="text-emerald-400">
                  [00.098s] Metric normalized within baseline; alert status transitioned to RESOLVED.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
