'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Plug,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Layers,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Truck,
  Activity,
  X,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { KPICard as KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/status-pill';

function IntegrationsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [activeTab, setActiveTab] = useState<'connections' | 'dlq' | 'simulation'>('connections');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [dlqItems, setDlqItems] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Connect Store Modal State
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'shopify' | 'woocommerce' | 'carrier'>('shopify');
  const [storeName, setStoreName] = useState('');
  const [shopDomain, setShopDomain] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outage simulation state
  const [isSimulatedOutage, setIsSimulatedOutage] = useState(false);
  const [bufferedUpdatesCount, setBufferedUpdatesCount] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      if (data.integrations) setIntegrations(data.integrations);
      if (data.deadLetterQueue) setDlqItems(data.deadLetterQueue);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStatus();
    if (searchParams.get('connected') === 'shopify') {
      const shop = searchParams.get('shop') || 'Shopify Store';
      showToast(`🎉 Successfully installed and connected ${shop} via Shopify Partner App OAuth!`);
    }
  }, [searchParams]);

  const handleConnectStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: modalPlatform,
          name: storeName || (modalPlatform === 'shopify' ? `${shopDomain}` : 'Connected Store'),
          shopDomain: modalPlatform === 'shopify' ? shopDomain : undefined,
          storeUrl: modalPlatform === 'woocommerce' ? storeUrl : undefined,
          apiKey: modalPlatform === 'carrier' || modalPlatform === 'shopify' ? apiKey : undefined,
          consumerKey: modalPlatform === 'woocommerce' ? consumerKey : undefined,
          consumerSecret: modalPlatform === 'woocommerce' ? consumerSecret : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        setConnectModalOpen(false);
        setStoreName('');
        setShopDomain('');
        setStoreUrl('');
        setApiKey('');
        setConsumerKey('');
        setConsumerSecret('');
        await fetchStatus();
      } else {
        showToast(data.error || 'Failed to connect store.');
      }
    } catch {
      showToast('Network error connecting store integration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (storeId: string) => {
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        await fetchStatus();
      } else {
        showToast(data.error || 'Failed to disconnect integration.');
      }
    } catch {
      showToast('Network error disconnecting integration.');
    }
  };

  const handleRetryDlq = async (dlqId: string) => {
    try {
      const res = await fetch('/api/integrations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dlqId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDlqItems((prev) => prev.filter((d) => d.id !== dlqId));
        showToast(data.message);
      }
    } catch {
      showToast('Network error retrying DLQ item.');
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white border-2 border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-700 shadow-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-black">Integrations Layer</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black border border-zinc-300">
              Decoupled Adapters
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Sales Channels & Integrations</h1>
          <p className="mt-0.5 text-sm text-zinc-600">
            Connect Shopify, WooCommerce, Stripe, and Multi-Carrier shipping with HMAC verification & DLQ recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('simulation')}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-zinc-100 transition-colors shadow-sm"
          >
            <Activity className="h-4 w-4 text-black" />
            <span>Test Outage & Replay</span>
          </button>
          <button
            onClick={() => setConnectModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Connect Sales Channel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Adapters"
          value={String(integrations.length)}
          description="Shopify, WooCommerce, Stripe, Carriers"
          icon={<Plug className="h-5 w-5 text-black" />}
        />
        <KpiCard
          title="Orders Ingested"
          value="29,010"
          trend={{ value: 12, isPositive: true }}
          description="Across all storefront channels"
          icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Webhook Success Rate"
          value="99.98%"
          description="HMAC cryptographic validation"
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
        />
        <KpiCard
          title="Dead Letter Queue"
          value={String(dlqItems.length)}
          description="Quarantined unprocessable events"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'connections'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Plug className="h-4 w-4" />
          <span>Active Connections ({integrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dlq')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'dlq'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <span>Dead Letter Queue (DLQ)</span>
          <span className="rounded-full bg-white border border-orange-400 px-2 py-0.5 text-xs text-orange-600 font-mono font-bold">
            {dlqItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
            activeTab === 'simulation'
              ? 'border-black text-black'
              : 'border-transparent text-zinc-600 hover:text-black'
          }`}
        >
          <Activity className="h-4 w-4 text-emerald-600" />
          <span>Outage & Replay Simulator</span>
        </button>
      </div>

      {/* Tab 1: Active Connections */}
      {activeTab === 'connections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {integrations.map((int) => (
            <div key={int.id} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white border border-zinc-300 text-black font-mono text-[10px] font-bold uppercase px-1.5 py-0.5">
                      {int.platform || int.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Connected
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-black mt-1">{int.name}</h3>
                  <p className="text-xs text-zinc-500 font-medium">Last synced: {int.lastSyncAt}</p>
                </div>

                {int.customStore && (
                  <button
                    onClick={() => handleDisconnect(int.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded hover:bg-zinc-100 transition-colors"
                    title="Disconnect integration"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Webhook Endpoint */}
              <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 space-y-1.5 text-xs">
                <span className="text-[11px] text-zinc-600 font-bold uppercase">Webhook Ingestion Endpoint:</span>
                <div className="flex items-center justify-between font-mono text-black bg-white p-2 rounded border border-zinc-300">
                  <span className="text-xs truncate">{int.endpoint}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(int.endpoint);
                      showToast(`Copied ${int.endpoint} to clipboard!`);
                    }}
                    className="p-1 text-zinc-500 hover:text-black ml-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(int.metrics || {}).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-white p-2 border border-zinc-200 shadow-xs">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">{k.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm font-bold font-mono text-black mt-0.5">
                      {typeof v === 'number' && k.includes('Minor')
                        ? `$${(v / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : String(v)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  HMAC-SHA256 Enforced
                </span>
                <button
                  onClick={() => showToast(`Sync triggered for ${int.name}`)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1 font-bold text-black hover:bg-zinc-100 transition-colors shadow-xs"
                >
                  Sync Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Dead Letter Queue */}
      {activeTab === 'dlq' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
            <h3 className="text-base font-bold text-black">Dead Letter Queue (DLQ)</h3>
            <p className="text-xs text-zinc-600 mt-0.5">
              Malformed or unprocessable webhook events quarantined for inspection with manual replay capability.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm bg-white">
              <thead className="border-b border-zinc-200 bg-white text-xs font-bold text-black uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Integration</th>
                  <th className="py-3 px-4">Error Reason</th>
                  <th className="py-3 px-4">Retries</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium text-xs bg-white">
                {dlqItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 font-semibold bg-white">
                      Zero items in Dead Letter Queue! All webhook streams healthy.
                    </td>
                  </tr>
                ) : (
                  dlqItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors bg-white">
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600">{item.eventId}</td>
                      <td className="py-3.5 px-4 text-black font-semibold">{item.integrationName}</td>
                      <td className="py-3.5 px-4 text-red-600">{item.errorMessage}</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-600">{item.retryCount} attempts</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRetryDlq(item.id)}
                          className="rounded-md bg-black hover:bg-zinc-800 text-white px-3 py-1 text-xs font-bold transition-colors shadow-sm"
                        >
                          Retry Event
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Outage & Replay Simulator */}
      {activeTab === 'simulation' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-black">Network Outage & Event Replay Simulator</h3>
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Verify resilience against external Shopify/WooCommerce downtime, network partitions, and duplicate webhooks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outage Toggle Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-black">1. External Connection State</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                    isSimulatedOutage
                      ? 'bg-white border-red-500 text-red-600'
                      : 'bg-white border-emerald-500 text-emerald-600'
                  }`}
                >
                  {isSimulatedOutage ? 'DOWNTIME ACTIVE' : 'ONLINE'}
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                Simulate a network partition or Shopify 503 API degradation. Outgoing stock movements are automatically buffered into an in-memory queue.
              </p>
              <button
                onClick={() => {
                  const nextState = !isSimulatedOutage;
                  setIsSimulatedOutage(nextState);
                  if (nextState) {
                    setBufferedUpdatesCount((prev) => prev + 5);
                    showToast('External outage simulated: 5 stock sync updates buffered in queue.');
                  } else {
                    showToast('Connection restored.');
                  }
                }}
                className={`w-full rounded-lg px-4 py-2 text-xs font-bold transition-colors border shadow-sm ${
                  isSimulatedOutage
                    ? 'bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50'
                    : 'bg-white border-red-500 text-red-600 hover:bg-red-50'
                }`}
              >
                {isSimulatedOutage ? 'Restore Network Connection' : 'Trigger Simulated Outage'}
              </button>
            </div>

            {/* Buffer Queue & Replay Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-black">2. Buffered Update Queue</span>
                <span className="font-mono text-sm font-bold text-black">{bufferedUpdatesCount} pending</span>
              </div>
              <p className="text-xs text-zinc-600">
                During external platform recovery, queued stock synchronizations and order acknowledgments are flushed sequentially with idempotency checks.
              </p>
              <button
                disabled={bufferedUpdatesCount === 0 || isSimulatedOutage}
                onClick={() => {
                  const count = bufferedUpdatesCount;
                  setBufferedUpdatesCount(0);
                  showToast(`Flushed ${count} buffered updates with zero duplicate items!`);
                }}
                className="w-full rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-black transition-colors shadow-sm"
              >
                {bufferedUpdatesCount > 0 ? `Flush & Sync Queue (${bufferedUpdatesCount})` : 'Queue Empty (Synchronized)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Store Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-black">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-black" />
                <h3 className="text-lg font-bold text-black">Connect New Sales Channel</h3>
              </div>
              <button
                onClick={() => setConnectModalOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModalPlatform('shopify')}
                className={`rounded-lg py-2 text-xs font-bold border transition-colors ${
                  modalPlatform === 'shopify'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                Shopify
              </button>
              <button
                type="button"
                onClick={() => setModalPlatform('woocommerce')}
                className={`rounded-lg py-2 text-xs font-bold border transition-colors ${
                  modalPlatform === 'woocommerce'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                WooCommerce
              </button>
              <button
                type="button"
                onClick={() => setModalPlatform('carrier')}
                className={`rounded-lg py-2 text-xs font-bold border transition-colors ${
                  modalPlatform === 'carrier'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                Shippo / Carrier
              </button>
            </div>

            <form onSubmit={handleConnectStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">Channel Label</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={
                    modalPlatform === 'shopify'
                      ? 'e.g. Acme Main Store'
                      : modalPlatform === 'woocommerce'
                      ? 'e.g. EU WooCommerce Outlet'
                      : 'e.g. EasyPost Primary Account'
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none"
                />
              </div>

              {modalPlatform === 'shopify' && (
                <>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">1-Click Shopify App Install (OAuth)</span>
                      <span className="text-[10px] font-bold text-green-700 bg-white px-2 py-0.5 rounded border border-green-300">Recommended</span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Installs the Storefront Ops partner app into your store with automatic order & inventory webhooks.
                    </p>
                    <a
                      href={`/api/integrations/shopify/authorize?shop=${encodeURIComponent(shopDomain || 'my-store.myshopify.com')}&demo=true`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-black px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <Plug className="h-4 w-4 text-white" />
                      <span>Install & Authorize App via Shopify</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </a>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-zinc-200"></div>
                    <span className="flex-shrink mx-2 text-[10px] font-bold text-zinc-500 uppercase">Or Connect Manually</span>
                    <div className="flex-grow border-t border-zinc-200"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Shopify Domain (.myshopify.com)
                    </label>
                    <input
                      type="text"
                      required
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      placeholder="your-brand.myshopify.com"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">
                      Admin API Access Token (Optional for sandbox demo)
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                    />
                  </div>
                </>
              )}

              {modalPlatform === 'woocommerce' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-black mb-1">Store URL</label>
                    <input
                      type="url"
                      required
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      placeholder="https://store.example.com"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Consumer Key</label>
                      <input
                        type="text"
                        required
                        value={consumerKey}
                        onChange={(e) => setConsumerKey(e.target.value)}
                        placeholder="ck_xxxxxxxxxxxx"
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Consumer Secret</label>
                      <input
                        type="password"
                        required
                        value={consumerSecret}
                        onChange={(e) => setConsumerSecret(e.target.value)}
                        placeholder="cs_xxxxxxxxxxxx"
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalPlatform === 'carrier' && (
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Shippo / EasyPost API Token</label>
                  <input
                    type="password"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="shippo_live_xxxxxxxx or EZTK_xxxxxxx"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-black placeholder-zinc-400 focus:border-black focus:outline-none font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-black px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Validating Connection...' : 'Save & Authorize Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center bg-white text-black">
          <Loader2 className="h-6 w-6 animate-spin text-black" />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
