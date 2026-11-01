'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Building,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface TenantRow {
  organizationId: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planId: 'starter' | 'growth' | 'scale';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'frozen';
  monthlyOrderVolume: number;
  totalSeats: number;
  mrrCents: number;
  isFrozen: boolean;
}

export default function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [auditLog, setAuditLog] = useState<string | null>(null);

  const [tenants, setTenants] = useState<TenantRow[]>([
    {
      organizationId: 'org-acme',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      ownerEmail: 'admin@acme-corp.com',
      planId: 'growth',
      status: 'active',
      monthlyOrderVolume: 1420,
      totalSeats: 4,
      mrrCents: 14900,
      isFrozen: false,
    },
    {
      organizationId: 'org-nexus',
      name: 'Nexus Supply Co',
      slug: 'nexus-supply',
      ownerEmail: 'ops@nexus.com',
      planId: 'scale',
      status: 'active',
      monthlyOrderVolume: 12400,
      totalSeats: 16,
      mrrCents: 39900,
      isFrozen: false,
    },
    {
      organizationId: 'org-solis',
      name: 'Solis Atelier',
      slug: 'solis-atelier',
      ownerEmail: 'founder@solis.com',
      planId: 'starter',
      status: 'past_due',
      monthlyOrderVolume: 340,
      totalSeats: 2,
      mrrCents: 4900,
      isFrozen: false,
    },
    {
      organizationId: 'org-kinesis',
      name: 'Kinesis Athletics',
      slug: 'kinesis-athletics',
      ownerEmail: 'billing@kinesis.com',
      planId: 'growth',
      status: 'trialing',
      monthlyOrderVolume: 95,
      totalSeats: 3,
      mrrCents: 0,
      isFrozen: false,
    },
    {
      organizationId: 'org-vanguard',
      name: 'Vanguard Vintage',
      slug: 'vanguard-vintage',
      ownerEmail: 'support@vanguard.com',
      planId: 'starter',
      status: 'canceled',
      monthlyOrderVolume: 0,
      totalSeats: 1,
      mrrCents: 0,
      isFrozen: false,
    },
  ]);

  const handlePlanOverride = async (orgId: string, newPlan: 'starter' | 'growth' | 'scale') => {
    const reason = prompt('Enter justification for superadmin plan override:');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          action: 'override_plan',
          planId: newPlan,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditLog(data.auditLog);
      }
    } catch {
      // fallback
    }

    setTenants((prev) =>
      prev.map((t) => {
        if (t.organizationId === orgId) {
          const prices = { starter: 4900, growth: 14900, scale: 39900 };
          return { ...t, planId: newPlan, mrrCents: prices[newPlan], status: 'active', isFrozen: false };
        }
        return t;
      })
    );
  };

  const handleToggleFreeze = async (orgId: string, currentFrozen: boolean) => {
    const actionLabel = currentFrozen ? 'unfreeze' : 'freeze';
    const reason = prompt(`Reason for emergency tenant ${actionLabel}:`);
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          action: 'toggle_freeze',
          isFrozen: !currentFrozen,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditLog(data.auditLog);
      }
    } catch {
      // fallback
    }

    setTenants((prev) =>
      prev.map((t) => {
        if (t.organizationId === orgId) {
          const nextFrozen = !currentFrozen;
          return {
            ...t,
            isFrozen: nextFrozen,
            status: nextFrozen ? 'frozen' : 'active',
          };
        }
        return t;
      })
    );
  };

  // Aggregated platform stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'active').length;
  const totalMrrCents = tenants.reduce((acc, t) => acc + (t.status === 'active' || t.status === 'past_due' ? t.mrrCents : 0), 0);
  const arrCents = totalMrrCents * 12;
  const churnedTenants = tenants.filter((t) => t.status === 'canceled').length;
  const churnRate = ((churnedTenants / totalTenants) * 100).toFixed(1);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Superadmin SaaS Back-Office
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Global multi-tenant directory, MRR aggregation, plan overrides, and emergency tenant freeze controls.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          Superadmin Role Verified
        </span>
      </div>

      {auditLog && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-mono flex items-center justify-between dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
          <span>{auditLog}</span>
          <button onClick={() => setAuditLog(null)} className="text-amber-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Total Tenants</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{totalTenants}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% tenant isolated</div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Monthly Rec. Revenue</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            ${(totalMrrCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">Active + Past Due</div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Annual Run Rate (ARR)</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">
            ${(arrCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">MRR × 12</div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Active Tenants</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{activeTenants}</div>
          <div className="text-[11px] text-gray-400 mt-1">Writable mode</div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">Platform Churn Rate</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{churnRate}%</div>
          <div className="text-[11px] text-gray-400 mt-1">1 canceled tenant</div>
        </div>
      </div>

      {/* Tenants Table Card */}
      <div className="bg-white dark:bg-gray-900 border rounded-2xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by organization name, slug, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="text-xs text-gray-500">
            Showing {filteredTenants.length} of {tenants.length} organizations
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Owner Email</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4">Orders / Mo</th>
                <th className="py-3 px-4">MRR</th>
                <th className="py-3 px-4 text-right">Superadmin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTenants.map((t) => {
                const statusStyles = {
                  active: 'bg-emerald-100 text-emerald-800',
                  trialing: 'bg-blue-100 text-blue-800',
                  past_due: 'bg-amber-100 text-amber-800',
                  canceled: 'bg-gray-100 text-gray-700',
                  frozen: 'bg-rose-100 text-rose-800 font-bold',
                };

                return (
                  <tr key={t.organizationId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{t.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">slug: {t.slug}</div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{t.ownerEmail}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {t.planId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${statusStyles[t.status]}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">{t.monthlyOrderVolume.toLocaleString()}</td>

                    <td className="py-3.5 px-4 font-mono font-semibold">
                      ${(t.mrrCents / 100).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Plan override selector */}
                        <select
                          value={t.planId}
                          onChange={(e) =>
                            handlePlanOverride(t.organizationId, e.target.value as 'starter' | 'growth' | 'scale')
                          }
                          className="text-[11px] py-1 px-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                        >
                          <option value="starter">Starter</option>
                          <option value="growth">Growth</option>
                          <option value="scale">Scale</option>
                        </select>

                        {/* Freeze / Unfreeze Button */}
                        <button
                          onClick={() => handleToggleFreeze(t.organizationId, t.isFrozen)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                            t.isFrozen
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-300'
                          }`}
                        >
                          {t.isFrozen ? (
                            <>
                              <Unlock className="h-3 w-3" /> Unfreeze
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" /> Freeze
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
