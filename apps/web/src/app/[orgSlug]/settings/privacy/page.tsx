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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white shadow-xs">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Privacy, GDPR / CCPA & Legal Compliance
            </h1>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Manage data subject access requests (DSAR), execute GDPR Article 17 erasure pipelines, and inspect sub-processor registries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-green-700 border border-green-300 flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> GDPR Art. 28 DPA Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black border border-zinc-300 flex items-center gap-1.5 shadow-xs">
            <FileCheck className="h-3.5 w-3.5 text-black" /> CCPA Compliant
          </span>
        </div>
      </div>

      {/* Grid: 2 Action Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: DSAR Data Export */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-black">
              <Download className="h-5 w-5 text-black" /> Subject Access Request (DSAR) Export
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Compile all personal data, orders, tickets, and communications for a customer into an encrypted machine-readable JSON package.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black">Customer ID</label>
              <input
                type="text"
                value={exportCustomerId}
                onChange={(e) => setExportCustomerId(e.target.value)}
                placeholder="e.g. cust-1"
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-black bg-white text-black shadow-xs"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={isExporting || !exportCustomerId}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              {isExporting ? 'Compiling Export...' : 'Generate Customer Data Export'}
            </button>
          </div>

          {exportData && (
            <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs font-mono space-y-2 max-h-48 overflow-y-auto shadow-xs">
              <div className="flex justify-between text-[11px] text-zinc-600 font-sans border-b border-zinc-200 pb-1">
                <span>Export ID: {exportData.exportId}</span>
                <span className="text-green-700 font-bold">Checksum: {exportData.checksum}</span>
              </div>
              <pre className="text-[10px] text-zinc-800">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Card 2: GDPR Article 17 Deletion */}
        <div className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-red-600">
              <UserX className="h-5 w-5 text-red-600" /> Right to be Forgotten (GDPR Art. 17)
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Permanently scrubs customer PII across customer profiles, order shipping addresses, and support tickets while preserving immutable integer financial totals for tax compliance.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black">Customer ID to Erase</label>
              <input
                type="text"
                value={erasureCustomerId}
                onChange={(e) => setErasureCustomerId(e.target.value)}
                placeholder="e.g. cust-1"
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-red-600 bg-white text-black shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black">Justification / Reason</label>
              <input
                type="text"
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-red-600 bg-white text-black shadow-xs"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleErasure}
              disabled={isErasing || !erasureCustomerId}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              {isErasing ? 'Scrubbing PII Across Tables...' : 'Execute Permanent PII Erasure'}
            </button>
          </div>

          {erasureResult && (
            <div className="p-3 bg-white border-2 border-green-500 rounded-xl text-xs space-y-1.5 shadow-xs">
              <div className="font-bold text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" /> Erasure Executed Successfully
              </div>
              <div className="text-[11px] text-zinc-700 space-y-0.5 font-medium">
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
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <Server className="h-4 w-4 text-black" /> Authorized Third-Party Sub-Processors
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Infrastructure partners authorized under the Storefront Ops Data Processing Addendum (DPA Article 28).
            </p>
          </div>
          <span className="text-xs text-green-700 font-bold">5 Active Sub-Processors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-zinc-200 text-black uppercase font-bold">
              <tr>
                <th className="py-2.5 px-4">Sub-Processor</th>
                <th className="py-2.5 px-4">Processing Function</th>
                <th className="py-2.5 px-4">Entity Location</th>
                <th className="py-2.5 px-4 text-right">Safeguards & Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {subProcessors.map((sp) => (
                <tr key={sp.name} className="hover:bg-zinc-50">
                  <td className="py-3 px-4 font-bold text-black">{sp.name}</td>
                  <td className="py-3 px-4 text-zinc-600 font-medium">{sp.role}</td>
                  <td className="py-3 px-4 font-mono text-zinc-500">{sp.location}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-black border border-zinc-300">
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
