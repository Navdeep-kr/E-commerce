'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public/public-nav';
import { PublicFooter } from '@/components/public/public-footer';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-12 py-12 space-y-8">
        <div className="space-y-2 border-b border-zinc-200 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white border border-green-300 px-2.5 py-0.5 text-[11px] font-bold text-green-700 font-mono">
              GDPR &amp; CCPA COMPLIANT
            </span>
            <span className="text-xs text-zinc-500 font-medium">Effective Date: November 1, 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Global Privacy Policy</h1>
          <p className="text-sm text-zinc-600">
            How Storefront Ops collects, encrypts, and processes personal data across our omnichannel platform.
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs leading-relaxed space-y-6 text-zinc-800">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">1. Categories of Data Processed</h2>
            <p>
              <strong>Workspace Account Data:</strong> Name, business email address, scrypt-hashed credentials, role assignments, and session audit timestamps. Payment card details are tokenized directly via Stripe; raw PAN is never stored on or transmitted through our servers.
            </p>
            <p>
              <strong>E-Commerce Consumer Data:</strong> Customer name, shipping address, phone number, email address, tracking numbers, and line items purchased through synchronized storefront channels (Shopify, WooCommerce, Amazon, POS).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">2. Certified Sub-Processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-zinc-200 text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 font-bold text-black">
                  <tr>
                    <th className="p-2.5">Sub-Processor</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Service Purpose</th>
                    <th className="p-2.5">Data Safeguards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-2.5 font-bold">Stripe Inc.</td>
                    <td className="p-2.5">United States</td>
                    <td className="p-2.5">Subscription Billing</td>
                    <td className="p-2.5">PCI-DSS Level 1 Provider</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Supabase / AWS</td>
                    <td className="p-2.5">US / EU</td>
                    <td className="p-2.5">Encrypted Database Hosting</td>
                    <td className="p-2.5">AES-256 at Rest, RLS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Resend Inc.</td>
                    <td className="p-2.5">United States</td>
                    <td className="p-2.5">Transactional Email Dispatch</td>
                    <td className="p-2.5">SOC 2 Type II, DPA with SCCs</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Twilio Inc.</td>
                    <td className="p-2.5">United States</td>
                    <td className="p-2.5">SMS Tracking Delivery</td>
                    <td className="p-2.5">ISO 27001, Binding Rules</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">3. Data Subject Rights (GDPR &amp; CCPA)</h2>
            <p>Under applicable privacy regulations, merchants and consumers retain complete rights to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to Access (DSAR):</strong> Export all personal data in machine-readable JSON format via Settings &gt; Privacy.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> Permanently redact PII across orders, customers, and tickets while retaining immutable integer financial totals strictly for tax and statutory accounting obligations (GDPR Art. 17(3)(b)).</li>
              <li><strong>Right to Portability:</strong> Transfer data between systems with automated bulk export tools.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">4. Data Retention &amp; Security Measures</h2>
            <p>
              All personal data transmitted to Storefront Ops is encrypted in transit using TLS 1.3 and at rest using AES-256. Database records are strictly partitioned using PostgreSQL Row-Level Security, preventing cross-tenant leakage.
            </p>
          </section>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-black">Exercise your privacy rights</p>
            <p className="text-zinc-600">Submit an automated erasure or export request directly via the Privacy Center.</p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-black px-4 py-2 font-bold text-white hover:bg-zinc-800 transition-colors"
          >
            Open Privacy Center
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
