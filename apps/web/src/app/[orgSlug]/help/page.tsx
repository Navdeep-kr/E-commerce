'use client';

import React, { useState } from 'react';
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
  LifeBuoy
} from 'lucide-react';

export default function HelpCenterPage({ params }: { params: { orgSlug: string } }) {
  const orgSlug = params?.orgSlug || 'acme-corp';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [completedSteps, setCompletedSteps] = useState<string[]>([
    'CONNECT_SALES_CHANNEL',
    'CONFIGURE_WAREHOUSE_BINS',
    'INGEST_CATALOG_INVENTORY',
    'SETUP_SHIPPING_CARRIER',
    'INVITE_TEAM_MEMBERS'
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
    .filter(s => !completedSteps.includes(s.id))
    .reduce((sum, s) => sum + s.minutes, 0);

  const toggleStep = (id: string) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter(s => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const guides = [
    {
      id: 'admin',
      category: 'admin',
      role: 'Owner & Administrator',
      icon: Shield,
      title: 'Organization Setup & RBAC Security Guide',
      docPath: 'docs/user-guides/owner-admin-guide.md',
      summary: 'Tenant profile configuration, team invites across 6 roles, subscription billing tiers, and GDPR/CCPA privacy controls.',
      topics: ['Workspace Profile', 'Role-Based Access Matrix', 'Stripe Billing State Machine', 'DSAR Privacy Scrub']
    },
    {
      id: 'warehouse',
      category: 'warehouse',
      role: 'Warehouse & Fulfillment',
      icon: Truck,
      title: 'Barcode Scanning & Pack Station Guide',
      docPath: 'docs/user-guides/warehouse-fulfillment-guide.md',
      summary: 'Optimized wave picking travel paths, live barcode verification at packing table, and thermal label generation.',
      topics: ['Batch & Wave Picking', 'Pack Station Chimes', 'Thermal Label Printing', 'Damaged Item Escalations']
    },
    {
      id: 'planner',
      category: 'inventory',
      role: 'Inventory Planner',
      icon: Layers,
      title: 'Append-Only Ledger & Demand Forecasting',
      docPath: 'docs/user-guides/inventory-planner-guide.md',
      summary: 'Core available = on_hand - committed invariant, purchase order receipts, landed costs, and stockout projections.',
      topics: ['Available Stock Invariant', 'CSV Catalog Ingestion', 'Landed Cost Penny Allocation', 'AI Velocity Forecast']
    },
    {
      id: 'support',
      category: 'support',
      role: 'Customer Support Representative',
      icon: Users,
      title: 'Omnichannel Inbox & RMA Returns Guide',
      docPath: 'docs/user-guides/customer-support-guide.md',
      summary: 'SLA urgency priority queues, 30-day return window policy validation, prepaid label issuance, and AI draft copilot.',
      topics: ['Ticket SLA Urgency Matrix', '30-Day RMA Policy Engine', 'Customer RFM Profiles', 'AI Macro Interpolation']
    },
    {
      id: 'finance',
      category: 'finance',
      role: 'Finance Controller',
      icon: DollarSign,
      title: 'Double-Entry General Ledger & Bank Payouts',
      docPath: 'docs/user-guides/finance-controller-guide.md',
      summary: 'Strict debits = credits balancing, 3-way Stripe bank reconciliation, P&L reporting, and statutory tax audit exports.',
      topics: ['Chart of Accounts', '3-Way Settlement Reconciliation', 'No-Float Cents Precision', 'Real-time P&L Statement']
    },
    {
      id: 'developer',
      category: 'api',
      role: 'Developer & Integrations',
      icon: Code2,
      title: 'Public REST API & Webhooks Reference',
      docPath: 'docs/api/public-rest-api-reference.md',
      summary: 'RESTful endpoints for orders, inventory, and shipments. HMAC-SHA256 signature verification and webhook retry schedules.',
      topics: ['Bearer Token Authentication', 'Integer Minor Units (Cents)', 'Rate Limiting (100 req/s)', 'HMAC Signature Code']
    }
  ];

  const filteredGuides = guides.filter(g => {
    const matchesCategory = activeCategory === 'all' || g.category === activeCategory;
    const matchesQuery = searchQuery === '' ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-white min-h-screen text-black">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, APIs, workflows..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-black text-black shadow-xs placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Interactive Onboarding Checklist Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-black" />
              <h2 className="text-base font-bold text-black">
                Unassisted Tenant Onboarding Checklist
              </h2>
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Complete these 6 foundational operational milestones to process your first order in &lt; 30 minutes.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-black">
                {completionPercent}% Completed ({completedSteps.length} of {onboardingSteps.length})
              </div>
              <div className="text-[11px] text-zinc-500 font-medium flex items-center justify-end gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-orange-600" />
                {remainingMinutes === 0 ? 'Onboarding Complete!' : `~${remainingMinutes} mins remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden border border-zinc-200">
          <div
            className="bg-black h-2.5 rounded-full transition-all duration-500"
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
                  isDone
                    ? 'border-2 border-green-500'
                    : 'border-zinc-200 hover:border-black'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isDone
                      ? 'bg-green-600 text-white'
                      : 'border border-zinc-300 text-transparent'
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
              className="p-5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-black transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-white border border-zinc-200 text-black rounded-lg shadow-xs">
                    <IconComponent className="w-5 h-5 text-black" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-zinc-500">{guide.role}</span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-black">
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
                <span className="text-black font-bold flex items-center gap-1 hover:underline cursor-pointer">
                  Open Guide <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
