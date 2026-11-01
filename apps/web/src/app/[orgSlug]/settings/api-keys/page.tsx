'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Key,
  Shield,
  Copy,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Code,
  Terminal,
  ExternalLink,
  Lock,
  Layers,
  Send,
  Radio,
  X,
  FileCode,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';
import { ApiKeyService, type ApiKeyRecord, type ApiScope } from '@storefront-ops/core';

export default function ApiKeysSettingsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([
    {
      id: 'key-1',
      name: 'Production ERP Connector',
      keyPrefix: 'sf_live_',
      hashedKey: 'mock_hash_1',
      preview: 'sf_live_...5678',
      scopes: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write'],
      rateLimitPerMin: 120,
      createdAtIso: '2026-11-01T00:00:00Z',
    },
    {
      id: 'key-2',
      name: 'Staging Integration Test Key',
      keyPrefix: 'sf_test_',
      hashedKey: 'mock_hash_2',
      preview: 'sf_test_...1234',
      scopes: ['orders:read', 'inventory:read'],
      rateLimitPerMin: 60,
      createdAtIso: '2026-10-25T14:30:00Z',
    },
  ]);

  // Outbound Webhooks state
  const [webhooks, setWebhooks] = useState<any[]>([
    {
      id: 'wh_sub_01',
      targetUrl: 'https://erp.example.com/webhooks/storefront',
      secret: 'whsec_client_secret_998124',
      subscribedEvents: ['order.created', 'order.shipped', 'inventory.adjusted'],
      enabled: true,
    },
  ]);

  // Modal State
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyEnv, setNewKeyEnv] = useState<'live' | 'test'>('live');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(['orders:read', 'inventory:read']);
  const [revealedRawKey, setRevealedRawKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const { rawKey, apiKeyRecord } = ApiKeyService.generateApiKey(
      newKeyEnv,
      newKeyName,
      selectedScopes,
      newKeyEnv === 'live' ? 120 : 60
    );

    setApiKeys((prev) => [apiKeyRecord, ...prev]);
    setRevealedRawKey(rawKey);
    showToast('API key generated! Copy it now (will not be shown again).');
  };

  const handleTestWebhookPing = async (secret: string) => {
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', secret }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`HMAC Signature Verified: ${data.headerValue.slice(0, 24)}...`);
      }
    } catch {
      showToast('Ping failed.');
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
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Developer Platform</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              OpenAPI 3.1 & REST v1
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">API Keys & Outbound Webhooks</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Scoped developer credentials, rate-limiting headers, HMAC-signed outbound webhooks, and OpenAPI schema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setGenerateModalOpen(true);
              setRevealedRawKey(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New API Key</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active API Keys"
          value={String(apiKeys.length)}
          description="Live & Test developer keys"
          icon={<Key className="h-5 w-5 text-emerald-400" />}
        />
        <KpiCard
          title="Rate Limit Default"
          value="120 req/min"
          description="Sliding window per credential"
          icon={<Shield className="h-5 w-5 text-indigo-400" />}
        />
        <KpiCard
          title="Outbound Webhooks"
          value={String(webhooks.length)}
          description="HMAC-SHA256 signed delivery"
          icon={<Send className="h-5 w-5 text-amber-400" />}
        />
        <KpiCard
          title="OpenAPI Spec"
          value="3.1.0 Ready"
          description="Swagger & Postman compatible"
          icon={<FileCode className="h-5 w-5 text-emerald-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'keys'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Key className="h-4 w-4" />
          <span>API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'webhooks'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Outbound Webhooks ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'docs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>Interactive cURL Playground & OpenAPI</span>
        </button>
      </div>

      {/* Tab 1: API Keys Management */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Key Preview</th>
                  <th className="py-3 px-4">Granted Scopes</th>
                  <th className="py-3 px-4">Rate Limit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-medium text-xs">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-100">{k.name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                          k.keyPrefix === 'sf_live_'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {k.keyPrefix.replace('sf_', '').replace('_', '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">{k.preview}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 px-1.5 py-0.5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{k.rateLimitPerMin} req/min</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setApiKeys((prev) => prev.filter((item) => item.id !== k.id));
                          showToast(`Revoked key ${k.name}.`);
                        }}
                        className="text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Outbound Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-100">Outbound Webhooks Dispatcher</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Storefront Ops automatically signs outbound events using timestamped HMAC-SHA256 (`X-Storefront-Signature`).
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-zinc-100">{wh.targetUrl}</span>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {wh.subscribedEvents.map((evt: string) => (
                      <span key={evt} className="rounded bg-zinc-800 text-[10px] font-mono text-indigo-300 px-2 py-0.5">
                        {evt}
                      </span>
                    ))}
                  </div>
                  <p className="font-mono text-zinc-500 text-[11px] pt-1">
                    Signing Secret: {wh.secret.slice(0, 10)}... (HMAC-SHA256)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestWebhookPing(wh.secret)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Test Ping</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Interactive cURL Playground */}
      {activeTab === 'docs' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Developer Quickstart Playground</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Copy ready-to-run cURL commands authenticated with your API key to test order sync and stock queries in &lt; 15 minutes.
              </p>
            </div>
            <a
              href="/api/v1/openapi"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View OpenAPI 3.1 JSON</span>
            </a>
          </div>

          <div className="space-y-4">
            {/* Example 1: Fetch Orders */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-300">1. Query Orders (GET /api/v1/orders)</span>
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>
                  curl -X GET https://api.storefrontops.com/api/v1/orders -H &quot;Authorization: Bearer sf_live_demo1234567890abcdef12345678&quot;
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      'curl -X GET https://api.storefrontops.com/api/v1/orders -H "Authorization: Bearer sf_live_demo1234567890abcdef12345678"'
                    );
                    showToast('cURL command copied!');
                  }}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Example 2: Query Inventory */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-300">2. Query Stock Levels (GET /api/v1/inventory)</span>
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>
                  curl -X GET https://api.storefrontops.com/api/v1/inventory -H &quot;Authorization: Bearer sf_live_demo1234567890abcdef12345678&quot;
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      'curl -X GET https://api.storefrontops.com/api/v1/inventory -H "Authorization: Bearer sf_live_demo1234567890abcdef12345678"'
                    );
                    showToast('cURL command copied!');
                  }}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Generate New Scoped API Key</h3>
              <button
                onClick={() => setGenerateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {revealedRawKey ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/20 p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-300 uppercase">Save Your API Key Now</p>
                  <p className="text-xs text-zinc-300">
                    For security reasons, this raw key will only be displayed once. If you lose it, you will need to generate a new key.
                  </p>
                  <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono text-xs text-emerald-400 break-all">
                    <span>{revealedRawKey}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(revealedRawKey);
                        showToast('Copied API key to clipboard!');
                      }}
                      className="p-1 text-zinc-400 hover:text-white ml-2"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setGenerateModalOpen(false)}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Key Description / Client Name:</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. NetSuite ERP Sync"
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Environment:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('live')}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        newKeyEnv === 'live'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      Live (sf_live_...)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKeyEnv('test')}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        newKeyEnv === 'test'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      Test Sandbox (sf_test_...)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">Select Scopes:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'webhooks:manage'] as ApiScope[]).map(
                      (scope) => (
                        <label key={scope} className="flex items-center gap-2 rounded bg-zinc-950 p-2 border border-zinc-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedScopes.includes(scope)}
                            onChange={(e) =>
                              setSelectedScopes((prev) =>
                                e.target.checked ? [...prev, scope] : prev.filter((s) => s !== scope)
                              )
                            }
                            className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-0"
                          />
                          <span className="font-mono text-zinc-300">{scope}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setGenerateModalOpen(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
