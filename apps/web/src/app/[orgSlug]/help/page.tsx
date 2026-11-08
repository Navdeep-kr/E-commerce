'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Play,
  Search,
  Shield,
  Truck,
  Layers,
  Users,
  DollarSign,
  Code2,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  LifeBuoy,
  X,
} from 'lucide-react';

interface GuideSection {
  title: string;
  content: string;
}

interface Guide {
  id: string;
  category: string;
  role: string;
  icon: any;
  title: string;
  docPath: string;
  summary: string;
  modulePath: string;
  moduleName: string;
  topics: string[];
  sections: GuideSection[];
}

export default function HelpCenterPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([
    'CONNECT_SALES_CHANNEL',
    'CONFIGURE_WAREHOUSE_BINS',
    'INGEST_CATALOG_INVENTORY',
    'SETUP_SHIPPING_CARRIER',
    'INVITE_TEAM_MEMBERS',
  ]);

  const onboardingSteps = [
    { id: 'CONNECT_SALES_CHANNEL', title: 'Connect Sales Channel', desc: 'Shopify, WooCommerce, or Custom REST API', role: 'Owner', minutes: 4 },
    { id: 'CONFIGURE_WAREHOUSE_BINS', title: 'Configure Warehouse & Bins', desc: 'Setup primary facility and alphanumeric bin sequences', role: 'Warehouse', minutes: 5 },
    { id: 'INGEST_CATALOG_INVENTORY', title: 'Ingest Product Catalog & Stock', desc: 'CSV upload and initial ledger balances', role: 'Planner', minutes: 6 },
    { id: 'SETUP_SHIPPING_CARRIER', title: 'Configure Shipping Carriers', desc: 'USPS, UPS, FedEx accounts & box presets', role: 'Warehouse', minutes: 3 },
    { id: 'INVITE_TEAM_MEMBERS', title: 'Invite Team & Assign Roles', desc: '6 RBAC roles with Row-Level Security', role: 'Admin', minutes: 3 },
    { id: 'PROCESS_FIRST_ORDER', title: 'Process First Order to Shipment', desc: 'Pick, pack verification & thermal shipping label', role: 'Fulfillment', minutes: 5 },
  ];

  const completionPercent = Math.round((completedSteps.length / onboardingSteps.length) * 100);
  const remainingMinutes = onboardingSteps
    .filter((s) => !completedSteps.includes(s.id))
    .reduce((sum, s) => sum + s.minutes, 0);

  const toggleStep = (id: string) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter((s) => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const guides: Guide[] = [
    {
      id: 'admin',
      category: 'admin',
      role: 'Owner & Administrator',
      icon: Shield,
      title: 'Organization Setup & RBAC Security Guide',
      docPath: 'docs/user-guides/owner-admin-guide.md',
      summary: 'Tenant profile configuration, team invites across 6 roles, subscription billing tiers, and GDPR/CCPA privacy controls.',
      modulePath: `/${orgSlug}/settings`,
      moduleName: 'Organization Settings',
      topics: ['Workspace Profile', 'Role-Based Access Matrix', 'Stripe Billing State Machine', 'DSAR Privacy Scrub'],
      sections: [
        {
          title: '1. Initial Workspace Configuration',
          content: 'Configure your primary business entity under Settings. Define store name, operational timezone, and reporting currency (USD, EUR, GBP). Connect external storefronts via Shopify Partner App OAuth or WooCommerce REST credentials.',
        },
        {
          title: '2. Multi-Tenant Server RBAC Matrix',
          content: 'Storefront Ops enforces strict PostgreSQL Row-Level Security (RLS) across 6 role tiers: Owner/Admin (Full), Fulfillment (Orders, Packing, Carriers), Planner (Catalog, Inventory, POs), Support (Inbox, RMAs), and Finance (General Ledger, P&L).',
        },
        {
          title: '3. Subscription Billing & Grace Periods',
          content: 'Manage plans under Settings -> Billing. Starter ($49/mo), Growth ($149/mo), and Scale ($399/mo). Payment failures enter a 7-day past_due grace period with live email alerts before locking into read-only mode.',
        },
      ],
    },
    {
      id: 'warehouse',
      category: 'warehouse',
      role: 'Warehouse & Fulfillment',
      icon: Truck,
      title: 'Barcode Scanning & Pack Station Guide',
      docPath: 'docs/user-guides/warehouse-fulfillment-guide.md',
      summary: 'Optimized wave picking travel paths, live barcode verification at packing table, and thermal label generation.',
      modulePath: `/${orgSlug}/fulfillment/pack-station`,
      moduleName: 'Pack Station',
      topics: ['Batch & Wave Picking', 'Pack Station Chimes', 'Thermal Label Printing', 'Damaged Item Escalations'],
      sections: [
        {
          title: '1. Wave & Batch Picking Path Optimization',
          content: 'Generate pick waves grouped by carrier cutoff time. The algorithm sorts order line items along the shortest aisle travel path (Bin A-01 -> A-02 -> B-01). Handheld scanners verify SKU barcodes with audible confirmation.',
        },
        {
          title: '2. Pack Station Verification & Rate Shopping',
          content: 'Scan the packing tote barcode at the table. Handheld scanners confirm every required SKU before enabling the "Buy Shipping Label" button. Carrier rates are compared live across USPS, UPS, and FedEx.',
        },
        {
          title: '3. Thermal 4x6 Label Generation',
          content: 'Selecting the optimal rate auto-generates thermal PDF / ZPL shipping labels, logs the tracking number, updates order status to SHIPPED, and dispatches customer tracking alerts.',
        },
      ],
    },
    {
      id: 'planner',
      category: 'inventory',
      role: 'Inventory Planner',
      icon: Layers,
      title: 'Append-Only Ledger & Demand Forecasting',
      docPath: 'docs/user-guides/inventory-planner-guide.md',
      summary: 'Core available = on_hand - committed invariant, purchase order receipts, landed costs, and stockout projections.',
      modulePath: `/${orgSlug}/inventory`,
      moduleName: 'Inventory Ledger',
      topics: ['Available Stock Invariant', 'CSV Catalog Ingestion', 'Landed Cost Penny Allocation', 'AI Velocity Forecast'],
      sections: [
        {
          title: '1. Strict Invariant: Available = On Hand - Committed',
          content: 'Stock movements are strictly append-only. Zero direct row overwrites. When an order is placed, units shift into COMMITTED. Available count updates across sales channels in sub-2ms.',
        },
        {
          title: '2. Purchase Orders & Landed Cost Allocation',
          content: 'Create POs for overseas suppliers. When receiving dock shipments, distribute freight and customs costs proportionally across SKUs with integer penny precision.',
        },
        {
          title: '3. Predictive Stockout Projections',
          content: 'The demand forecasting engine analyzes 30-day velocity to forecast exact stockout dates and generate automated reorder suggestions before safety thresholds are breached.',
        },
      ],
    },
    {
      id: 'support',
      category: 'support',
      role: 'Customer Support Representative',
      icon: Users,
      title: 'Omnichannel Inbox & RMA Returns Guide',
      docPath: 'docs/user-guides/customer-support-guide.md',
      summary: 'SLA urgency priority queues, 30-day return window policy validation, prepaid label issuance, and AI draft copilot.',
      modulePath: `/${orgSlug}/support`,
      moduleName: 'Support Inbox',
      topics: ['Ticket SLA Urgency Matrix', '30-Day RMA Policy Engine', 'Customer RFM Profiles', 'AI Macro Interpolation'],
      sections: [
        {
          title: '1. SLA Urgency Queue & Customer RFM Profiles',
          content: 'Incoming tickets are categorized by urgency (Urgent < 1h, High < 4h, Normal < 12h). Customer cards show lifetime spend, orders count, and RFM Champion vs At-Risk badges.',
        },
        {
          title: '2. 1-Click Refunds & Self-Serve RMA Portal',
          content: 'Issue full or partial refunds directly to the customer credit card via Stripe. Direct customers to /{orgSlug}/returns/portal where they generate prepaid QR return labels.',
        },
        {
          title: '3. Policy Compliance & AI Draft Copilot',
          content: 'Final Sale items are automatically protected against unauthorized return overrides. AI Copilot synthesizes order timelines into compliant, empathetic draft customer replies.',
        },
      ],
    },
    {
      id: 'finance',
      category: 'finance',
      role: 'Finance Controller',
      icon: DollarSign,
      title: 'Double-Entry General Ledger & Bank Payouts',
      docPath: 'docs/user-guides/finance-controller-guide.md',
      summary: 'Strict debits = credits balancing, 3-way Stripe bank reconciliation, P&L reporting, and statutory tax audit exports.',
      modulePath: `/${orgSlug}/finance`,
      moduleName: 'Financial Ledger',
      topics: ['Chart of Accounts', '3-Way Settlement Reconciliation', 'No-Float Cents Precision', 'Real-time P&L Statement'],
      sections: [
        {
          title: '1. Immutable Double-Entry Balancing',
          content: 'Every sale, refund, shipping cost, and merchant processing fee records balanced debit and credit entries. Cents precision (minor units) eliminates floating-point rounding drift.',
        },
        {
          title: '2. 3-Way Stripe Payout Reconciliation',
          content: 'Automated settlement algorithms verify daily bank deposit amounts against captured orders and refund debits, flagging any variance greater than $0.00.',
        },
        {
          title: '3. Real-Time P&L & GAAP Audit Exports',
          content: 'Generate live revenue, COGS, gross margin, and operating contribution statements. Export statutory GAAP/IFRS ledger CSVs for quarterly audit filings.',
        },
      ],
    },
    {
      id: 'developer',
      category: 'api',
      role: 'Developer & Integrations',
      icon: Code2,
      title: 'Public REST API & Webhooks Reference',
      docPath: 'docs/api/public-rest-api-reference.md',
      summary: 'RESTful endpoints for orders, inventory, and shipments. HMAC-SHA256 signature verification and webhook retry schedules.',
      modulePath: `/${orgSlug}/settings/api-keys`,
      moduleName: 'API Keys & Developer Portal',
      topics: ['Bearer Token Authentication', 'Integer Minor Units (Cents)', 'Rate Limiting (100 req/s)', 'HMAC Signature Code'],
      sections: [
        {
          title: '1. Scoped API Key Authentication',
          content: 'Generate Bearer keys (sf_live_... / sf_test_...) with granular scopes (orders:read, inventory:write, webhooks:manage) and per-minute rate limits.',
        },
        {
          title: '2. Webhook HMAC Cryptographic Validation',
          content: 'Inbound payloads from Shopify and Stripe include cryptographic headers (x-shopify-hmac-sha256, stripe-signature) verified using constant-time timingSafeEqual comparison.',
        },
        {
          title: '3. Interactive OpenAPI Schema Playground',
          content: 'Inspect the full OpenAPI 3.1 specification at /api/v1/openapi. Test live order queries and stock adjustments using the cURL playground under Settings -> Developer API.',
        },
      ],
    },
  ];

  const filteredGuides = guides.filter((g) => {
    const matchesCategory = activeCategory === 'all' || g.category === activeCategory;
    const matchesQuery =
      searchQuery === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="w-full space-y-8 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-zinc-200 text-black rounded-xl shadow-xs">
              <BookOpen className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                Documentation &amp; Help Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-green-700 font-bold border border-green-300">
                  SLA: &lt; 30 MIN ONBOARDING
                </span>
              </h1>
              <p className="text-sm text-zinc-600 mt-1">
                Role-based operational guides, developer API references, and interactive onboarding checklist for {orgSlug}.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guides, topics, APIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      {/* Interactive Onboarding Checklist */}
      <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Getting Started Checklist</span>
              <span className="text-xs font-bold text-black font-mono">
                {completedSteps.length}/{onboardingSteps.length} Steps Complete
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              Interactive 30-minute launch roadmap. Click any step to toggle completion status.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>~{remainingMinutes}m remaining</span>
            </div>
            <div className="text-xs font-bold text-black font-mono bg-white border border-zinc-200 px-2.5 py-1 rounded-lg">
              {completionPercent}% Ready
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-green-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {onboardingSteps.map((step, idx) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 bg-white ${
                  isDone ? 'border-2 border-green-500' : 'border-zinc-200 hover:border-black'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone ? 'bg-green-600 text-white' : 'border border-zinc-300 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black leading-tight">
                      {idx + 1}. {step.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 line-clamp-1">{step.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="bg-white border border-zinc-200 px-1.5 py-0.2 rounded font-bold text-black">
                      {step.role}
                    </span>
                    <span className="font-medium">~{step.minutes}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'admin', 'warehouse', 'inventory', 'support', 'finance', 'api'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all shadow-xs ${
              activeCategory === cat
                ? 'bg-black text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:text-black'
            }`}
          >
            {cat === 'all' ? 'All Guides' : cat}
          </button>
        ))}
      </div>

      {/* Role Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => {
          const IconComponent = guide.icon;
          return (
            <div
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-black transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-white border border-zinc-200 text-black rounded-lg shadow-xs">
                    <IconComponent className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-zinc-500">{guide.role}</span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-black group-hover:underline">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{guide.summary}</p>
                </div>

                {/* Topics List */}
                <div className="space-y-1 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Key Topics:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {guide.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white border border-zinc-200 text-black px-2 py-0.5 rounded font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[170px]">{guide.docPath}</span>
                <span className="text-black font-bold flex items-center gap-1 group-hover:underline">
                  Open Guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Guide Reader Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-300 bg-white p-6 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-300 uppercase">
                    {selectedGuide.role}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{selectedGuide.docPath}</span>
                </div>
                <h2 className="text-lg font-bold text-black">{selectedGuide.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Guide Sections */}
            <div className="space-y-5 text-xs text-zinc-700 leading-relaxed">
              <p className="font-medium text-black bg-zinc-50 border border-zinc-200 p-3 rounded-lg">
                {selectedGuide.summary}
              </p>

              {selectedGuide.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5 border-b border-zinc-100 pb-4 last:border-0">
                  <h3 className="font-bold text-black text-sm">{sec.title}</h3>
                  <p className="text-zinc-600 font-medium">{sec.content}</p>
                </div>
              ))}
            </div>

            {/* Modal Footer / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-black transition-colors"
              >
                Close Guide
              </button>

              <Link
                href={selectedGuide.modulePath}
                onClick={() => setSelectedGuide(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-xs"
              >
                <span>Launch {selectedGuide.moduleName}</span>
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
