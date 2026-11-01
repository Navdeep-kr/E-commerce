'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield,
  FileText,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Server,
  ExternalLink,
  Lock,
  UserX,
  FileCheck,
} from 'lucide-react';

export default function PrivacySettingsPage() {
  const routeParams = useParams();
  const orgSlug = (routeParams?.orgSlug as string) || 'acme-commerce';

  const [exportCustomerId, setExportCustomerId] = useState('cust-1');
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<any>(null);

  const [erasureCustomerId, setErasureCustomerId] = useState('cust-1');
  const [erasureReason, setErasureReason] = useState('Customer invoked GDPR Article 17 right to erasure');
  const [isErasing, setIsErasing] = useState(false);
  const [erasureResult, setErasureResult] = useState<any>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportData(null);
    try {
      const res = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: exportCustomerId, organizationId: orgSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setExportData(data.exportPackage);
      }
    } catch {
      // fallback
    } finally {
      setIsExporting(false);
    }
  };

  const handleErasure = async () => {
    if (!confirm(`Are you sure you want to permanently erase PII for customer ${erasureCustomerId}? This action is irreversible.`)) {
      return;
    }

    setIsErasing(true);
    setErasureResult(null);
    try {
      const res = await fetch('/api/privacy/erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: erasureCustomerId,
          organizationId: orgSlug,
          reason: erasureReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setErasureResult(data);
      }
    } catch {
      // fallback
    } finally {
      setIsErasing(false);
    }
  };

  const subProcessors = [
    { name: 'Supabase (PostgreSQL / AWS)', role: 'Database & Secure Storage', location: 'USA / EU', compliance: 'AES-256, RLS' },
    { name: 'Stripe Inc.', role: 'Subscription Billing & Payments', location: 'USA', compliance: 'PCI-DSS Level 1' },
    { name: 'Inngest Inc.', role: 'Asynchronous Workflow Queue', location: 'USA', compliance: 'TLS 1.3, Ephemeral' },
    { name: 'Resend Inc.', role: 'Transactional Email Service', location: 'USA', compliance: 'SOC 2 Type II, DPA' },
    { name: 'Twilio Inc.', role: 'Transactional SMS Carrier Gateway', location: 'USA', compliance: 'ISO 27001' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Privacy, GDPR / CCPA & Legal Compliance
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage data subject access requests (DSAR), execute GDPR Article 17 erasure pipelines, and inspect sub-processor registries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> GDPR Art. 28 DPA Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5" /> CCPA Compliant
          </span>
        </div>
      </div>

      {/* Grid: 2 Action Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: DSAR Data Export */}
        <div className="bg-white dark:bg-gray-900 border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
              <Download className="h-5 w-5 text-indigo-600" /> Subject Access Request (DSAR) Export
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Compile all personal data, orders, tickets, and communications for a customer into an encrypted machine-readable JSON package.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Customer ID</label>
              <input
                type="text"
                value={exportCustomerId}
                onChange={(e) => setExportCustomerId(e.target.value)}
                placeholder="e.g. cust-1"
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={isExporting || !exportCustomerId}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow flex items-center justify-center gap-2"
            >
              {isExporting ? 'Compiling Export...' : 'Generate Customer Data Export'}
            </button>
          </div>

          {exportData && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border text-xs font-mono space-y-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between text-[11px] text-gray-500 font-sans border-b pb-1">
                <span>Export ID: {exportData.exportId}</span>
                <span className="text-emerald-600 font-bold">Checksum: {exportData.checksum}</span>
              </div>
              <pre className="text-[10px] text-gray-700 dark:text-gray-300">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Card 2: GDPR Article 17 Deletion */}
        <div className="bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-rose-700 dark:text-rose-400">
              <UserX className="h-5 w-5" /> Right to be Forgotten (GDPR Art. 17)
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Permanently scrubs customer PII across customer profiles, order shipping addresses, and support tickets while preserving immutable integer financial totals for tax compliance.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Customer ID to Erase</label>
              <input
                type="text"
                value={erasureCustomerId}
                onChange={(e) => setErasureCustomerId(e.target.value)}
                placeholder="e.g. cust-1"
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Justification / Reason</label>
              <input
                type="text"
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleErasure}
              disabled={isErasing || !erasureCustomerId}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition shadow flex items-center justify-center gap-2"
            >
              {isErasing ? 'Scrubbing PII Across Tables...' : 'Execute Permanent PII Erasure'}
            </button>
          </div>

          {erasureResult && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Erasure Executed Successfully
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-0.5">
                <div>• Customer Record: Anonymized</div>
                <div>• Orders Scrubbed: {erasureResult.erasureSummary.ordersScrubbed} (financial amounts preserved)</div>
                <div>• Support Tickets Scrubbed: {erasureResult.erasureSummary.ticketsScrubbed}</div>
                <div>• Audit Log ID: <span className="font-mono">{erasureResult.auditLog.id}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Processors Registry Table */}
      <div className="bg-white dark:bg-gray-900 border rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" /> Authorized Third-Party Sub-Processors
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Infrastructure partners authorized under the Storefront Ops Data Processing Addendum (DPA Article 28).
            </p>
          </div>
          <span className="text-xs text-emerald-600 font-semibold">5 Active Sub-Processors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Sub-Processor</th>
                <th className="py-2.5 px-4">Processing Function</th>
                <th className="py-2.5 px-4">Entity Location</th>
                <th className="py-2.5 px-4 text-right">Safeguards & Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {subProcessors.map((sp) => (
                <tr key={sp.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{sp.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{sp.role}</td>
                  <td className="py-3 px-4 font-mono text-gray-500">{sp.location}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                      {sp.compliance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
