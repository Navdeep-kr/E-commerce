'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Settings,
  CreditCard,
  Key,
  Activity,
  Gauge,
  ShieldCheck,
  GitBranch,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Building2,
  Users,
  Mail,
  Globe,
  Clock,
  Save,
  ArrowRight,
  Shield,
  DollarSign,
  Cpu,
  Lock,
} from 'lucide-react';

export default function SettingsHubPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  const [orgName, setOrgName] = useState('Acme Commerce Labs');
  const [adminEmail, setAdminEmail] = useState('admin@acmecommerce.com');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/New_York (EST)');
  const [orderPrefix, setOrderPrefix] = useState('ORD-');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Organization settings updated successfully!');
  };

  const settingsModules = [
    {
      title: 'Billing & Subscriptions',
      description: 'Scale plan ($299/mo), Stripe invoices, payment methods, and seat quota management.',
      href: `/${orgSlug}/settings/billing`,
      icon: CreditCard,
      status: 'Active (Scale Plan)',
      statusColor: 'text-green-700 bg-white border border-green-300',
    },
    {
      title: 'API Keys & Webhooks',
      description: 'Scoped API tokens, HMAC webhook signature verification, and developer endpoint docs.',
      href: `/${orgSlug}/settings/api-keys`,
      icon: Key,
      status: '4 Active Keys',
      statusColor: 'text-black bg-white border border-zinc-200',
    },
    {
      title: 'Observability & Telemetry',
      description: 'Real-time telemetry, OpenTelemetry traces, distributed log streams, and error budgets.',
      href: `/${orgSlug}/settings/observability`,
      icon: Activity,
      status: '99.98% Uptime',
      statusColor: 'text-green-700 bg-white border border-green-300',
    },
    {
      title: 'Performance & Benchmarking',
      description: 'Latency benchmarks (p95 < 45ms), connection pools, and synthetic stress simulation.',
      href: `/${orgSlug}/settings/performance`,
      icon: Gauge,
      status: '1,200 req/sec Peak',
      statusColor: 'text-orange-600 bg-white border border-orange-300',
    },
    {
      title: 'Privacy & GDPR Compliance',
      description: 'Data subject access requests (DSAR), right-to-be-forgotten erasure, and audit logs.',
      href: `/${orgSlug}/settings/privacy`,
      icon: ShieldCheck,
      status: 'GDPR / CCPA Compliant',
      statusColor: 'text-green-700 bg-white border border-green-300',
    },
    {
      title: 'Deployments & CI/CD',
      description: 'Multi-region edge environments, zero-downtime migrations, and git commit history.',
      href: `/${orgSlug}/settings/deployments`,
      icon: GitBranch,
      status: 'v2.4.0 Production',
      statusColor: 'text-black bg-white border border-zinc-200',
    },
    {
      title: 'QA Acceptance Test Suite',
      description: '27 automated end-to-end operational journey tests with zero-regression guarantees.',
      href: `/${orgSlug}/settings/qa`,
      icon: CheckCircle2,
      status: '190/190 Tests Pass',
      statusColor: 'text-green-700 bg-white border border-green-300',
    },
    {
      title: 'Staged Launch Gates',
      description: 'Alpha -> Beta -> GA migration checklists, 100-store automated weekly onboarding batches.',
      href: `/${orgSlug}/settings/launch`,
      icon: Rocket,
      status: 'GA Phase Active',
      statusColor: 'text-orange-600 bg-white border border-orange-300',
    },
    {
      title: 'Growth & Cohort Analytics',
      description: 'Store conversion funnels, onboarding checklists, expansion cohorts, and customer LTV.',
      href: `/${orgSlug}/settings/growth`,
      icon: TrendingUp,
      status: '24 Cohorts Running',
      statusColor: 'text-black bg-white border border-zinc-200',
    },
  ];

  const teamMembers = [
    { name: 'Alex Mercer', email: 'admin@acmecommerce.com', role: 'Owner Admin', status: 'Active' },
    { name: 'Morgan Blake', email: 'manager@acmecommerce.com', role: 'Store Manager', status: 'Active' },
    { name: 'Sam Rivera', email: 'warehouse@acmecommerce.com', role: 'Fulfillment Lead', status: 'Active' },
    { name: 'Dana Vance', email: 'purchasing@acmecommerce.com', role: 'Purchasing Agent', status: 'Active' },
    { name: 'Taylor Chen', email: 'support@acmecommerce.com', role: 'Customer Support', status: 'Active' },
    { name: 'Jordan Bell', email: 'finance@acmecommerce.com', role: 'Finance Director', status: 'Active' },
  ];

  return (
    <div className="space-y-6 bg-white text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white border-2 border-green-500 px-4 py-3 text-sm text-green-700 shadow-xl">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
          <span className="font-semibold text-black">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Platform Settings</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-300">
              Owner Admin Policy Active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-black">Organization & Store Settings</h1>
          <p className="text-xs text-zinc-600 mt-0.5">
            Manage platform configuration, API credentials, billing subscriptions, and compliance policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 pb-2 overflow-x-auto text-xs bg-white">
        <Link
          href={`/${orgSlug}/settings`}
          className="rounded-lg bg-black text-white px-3 py-1.5 font-bold whitespace-nowrap"
        >
          Overview
        </Link>
        <Link
          href={`/${orgSlug}/settings/billing`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Billing & Plans
        </Link>
        <Link
          href={`/${orgSlug}/settings/api-keys`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          API Keys & Webhooks
        </Link>
        <Link
          href={`/${orgSlug}/settings/observability`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Observability
        </Link>
        <Link
          href={`/${orgSlug}/settings/performance`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Performance
        </Link>
        <Link
          href={`/${orgSlug}/settings/privacy`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Privacy & GDPR
        </Link>
        <Link
          href={`/${orgSlug}/settings/deployments`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Deployments
        </Link>
        <Link
          href={`/${orgSlug}/settings/qa`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          QA Acceptance
        </Link>
        <Link
          href={`/${orgSlug}/settings/launch`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Staged Launch
        </Link>
        <Link
          href={`/${orgSlug}/settings/growth`}
          className="rounded-lg bg-white text-black hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 font-semibold whitespace-nowrap"
        >
          Growth Ops
        </Link>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Current Subscription</span>
            <CreditCard className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-xl font-bold text-black">Scale Plan</div>
          <div className="mt-1 text-xs text-green-700 font-medium">Stripe Auto-Renew: $299.00/mo</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Team Members</span>
            <Users className="h-4 w-4 text-black" />
          </div>
          <div className="mt-2 text-xl font-bold text-black">8 Active Seats</div>
          <div className="mt-1 text-xs text-zinc-600 font-medium">17 seats remaining on plan</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Data Security</span>
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-black">RLS Enforced</div>
          <div className="mt-1 text-xs text-green-700 font-medium">Strict tenant-boundary isolation</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
            <span>Regression Status</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-black">190 Tests Passing</div>
          <div className="mt-1 text-xs text-green-700 font-medium">0 test failures across 81 suites</div>
        </div>
      </div>

      {/* Main Settings Directory (9 Sub-Sections) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-3">Settings Directory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-black group-hover:bg-black group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${mod.statusColor}`}>
                      {mod.status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-black group-hover:text-black">
                    {mod.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-black">
                  <span>Configure Settings</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Organization Details & Team Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization Configuration Form (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
            <Building2 className="h-4 w-4 text-black" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">Store Configuration</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-black mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Organization Slug</label>
                <input
                  type="text"
                  disabled
                  value={orgSlug}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-black mb-1">Primary Admin Contact</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Order Number Prefix</label>
                <input
                  type="text"
                  value={orderPrefix}
                  onChange={(e) => setOrderPrefix(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-black focus:outline-none focus:border-black font-mono font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-black mb-1">Accounting Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">Operations Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-xs text-black focus:outline-none focus:border-black font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Save Store Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Staff Directory (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-black" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">Active Staff & Roles</h2>
            </div>
            <span className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-black font-mono">
              6 Members
            </span>
          </div>

          <div className="divide-y divide-zinc-100 overflow-y-auto max-h-[300px]">
            {teamMembers.map((member) => (
              <div key={member.email} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-black">{member.name}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{member.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-white border border-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-black font-mono">
                    {member.role}
                  </span>
                  <p className="text-[10px] text-green-700 font-semibold mt-0.5">{member.status}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <Link
              href={`/${orgSlug}/settings/billing`}
              className="text-xs font-bold text-black hover:underline flex items-center justify-between"
            >
              <span>Manage seat licenses & permissions &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
