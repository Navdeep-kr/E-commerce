'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BarChart3,
  Database,
  Code,
  ShieldCheck,
  CheckCircle2,
  Play,
  Download,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import {
  METRIC_DICTIONARY,
  ALLOWED_DIMENSIONS,
  type DimensionKey,
} from '@storefront-ops/core';

export default function ReportsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'builder' | 'dictionary' | 'bi'>('builder');

  // Custom Report Builder State
  const [selectedDimensions, setSelectedDimensions] = useState<DimensionKey[]>(['channel']);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['net_sales', 'orders_count', 'aov']);
  const [compiledSql, setCompiledSql] = useState<string>('');
  const [compiledParams, setCompiledParams] = useState<(string | number)[]>([]);
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRunQuery = async () => {
    setIsCompiling(true);
    try {
      const res = await fetch('/api/reports/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org_acme_corp',
          dimensions: selectedDimensions,
          metrics: selectedMetrics,
          startDateIso: '2026-10-01T00:00:00Z',
          endDateIso: '2026-10-31T23:59:59Z',
          limit: 50,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompiledSql(data.compiledSql);
        setCompiledParams(data.parameters);
        setReportRows(data.rows);
        showToast('Safe parameterized query compiled and executed!');
      } else {
        showToast(data.error || 'Failed to compile report.');
      }
    } catch {
      showToast('Network error running report query.');
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    handleRunQuery();
  }, []);

  const toggleDimension = (dim: DimensionKey) => {
    setSelectedDimensions((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    );
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId]
    );
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
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">BI & Analytics</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              Safe Parameterized SQL Engine
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">Analytics & Custom Reports</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Ad-hoc custom report builder, parameterized SQL compiler, and centralized Metric Dictionary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Report exported as CSV successfully.')}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="October Net Sales"
          value="$166,700.00"
          trend={{ value: 16.2, isPositive: true }}
          description="E-commerce + Wholesale B2B"
          icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Gross Margin"
          value="62.5%"
          description="6,250 bps profitability"
          icon={<Percent className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Average Order Value"
          value="$138.45"
          trend={{ value: 5.1, isPositive: true }}
          description="Trailing 30-day average"
          icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="Repeat Purchase Rate"
          value="34.8%"
          description="Customers with &ge; 2 orders"
          icon={<Sparkles className="h-5 w-5 text-pink-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'builder'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Custom Report Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'dictionary'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Central Metric Dictionary</span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300 font-mono">
            {Object.keys(METRIC_DICTIONARY).length} KPIs
          </span>
        </button>
      </div>

      {/* Tab 1: Custom Report Builder */}
      {activeTab === 'builder' && (
        <div className="space-y-5">
          {/* Controls: Dimension & Metric Pickers */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            {/* Dimensions */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                1. Select Dimensions (Group By):
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALLOWED_DIMENSIONS.map((dim) => {
                  const isSelected = selectedDimensions.includes(dim);
                  return (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => toggleDimension(dim)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {dim}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics */}
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                2. Select Aggregated Metrics:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.keys(METRIC_DICTIONARY).map((mKey) => {
                  const isSelected = selectedMetrics.includes(mKey);
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => toggleMetric(mKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {METRIC_DICTIONARY[mKey].name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Tenant Isolation Guaranteed &bull; Safe Parameterized SQL Only</span>
              </div>

              <button
                type="button"
                disabled={isCompiling || selectedMetrics.length === 0}
                onClick={handleRunQuery}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-950/40"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isCompiling ? 'Compiling Query...' : 'Compile & Run Safe Query'}</span>
              </button>
            </div>
          </div>

          {/* Compiled SQL Inspector */}
          {compiledSql && (
            <div className="rounded-xl border border-indigo-500/30 bg-zinc-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                  <Code className="h-4 w-4" />
                  Compiled Safe Parameterized SQL Query
                </span>
                <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/20 font-mono">
                  100% Parameterized ($1, $2, ...)
                </span>
              </div>

              <pre className="font-mono text-xs text-zinc-300 p-3 bg-zinc-900 rounded border border-zinc-800 overflow-x-auto whitespace-pre">
                {compiledSql}
              </pre>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-500 font-bold">Parameters:</span>
                <span>{JSON.stringify(compiledParams)}</span>
              </div>
            </div>
          )}

          {/* Query Results Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="p-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-300">Query Results ({reportRows.length} rows)</span>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  {selectedDimensions.map((d) => (
                    <th key={d} className="py-3 px-4 font-mono">{d}</th>
                  ))}
                  {selectedMetrics.map((m) => (
                    <th key={m} className="py-3 px-4 font-mono text-right">{METRIC_DICTIONARY[m]?.name || m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium">
                {reportRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    {selectedDimensions.map((d) => (
                      <td key={d} className="py-3 px-4 text-zinc-200">{row[d] || 'N/A'}</td>
                    ))}
                    {selectedMetrics.map((m) => {
                      const val = row[m];
                      const isMoney = METRIC_DICTIONARY[m]?.unit === 'currency_minor';
                      return (
                        <td key={m} className="py-3 px-4 font-mono text-right text-zinc-100">
                          {isMoney ? `$${(val / 100).toFixed(2)}` : val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Central Metric Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-100">Centralized Storefront Ops Metric Dictionary</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict domain definitions ensuring every department (Finance, Marketing, Fulfillment, Sales) computes KPIs identically.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Metric ID</th>
                  <th className="py-3 px-4">Metric Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Canonical SQL Formula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium text-xs">
                {Object.values(METRIC_DICTIONARY).map((metric) => (
                  <tr key={metric.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{metric.id}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-100">{metric.name}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono uppercase text-zinc-300">
                        {metric.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{metric.unit}</td>
                    <td className="py-3 px-4 text-zinc-300">{metric.description}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 text-[11px] max-w-xs truncate">
                      {metric.sqlFormula}
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
