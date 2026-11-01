'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public/public-nav';
import { PublicFooter } from '@/components/public/public-footer';
import { FileCheck, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="space-y-2 border-b border-zinc-200 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white border border-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-black font-mono">
              STANDARD CONTRACTUAL CLAUSES (SCC)
            </span>
            <span className="text-xs text-zinc-500 font-medium">Article 28 GDPR Compliant</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Data Processing Addendum (DPA)</h1>
          <p className="text-sm text-zinc-600">
            Governing the processing of personal data by Storefront Ops on behalf of enterprise e-commerce merchants.
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs leading-relaxed space-y-6 text-zinc-800">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">1. Scope and Applicability</h2>
            <p>
              This Data Processing Addendum (&quot;DPA&quot;) supplements the Storefront Ops Master Terms of Service. It applies to all processing of Personal Data carried out by Storefront Ops as a Data Processor on behalf of the Merchant acting as a Data Controller under the EU GDPR, UK GDPR, and Swiss FADP.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">2. Processor Obligations</h2>
            <p>Storefront Ops agrees and covenants that it shall:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process Personal Data only on documented instructions from the Merchant, including with regard to transfers of Personal Data to a third country.</li>
              <li>Ensure that persons authorized to process the Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.</li>
              <li>Implement and maintain the Technical and Organizational Measures (TOMs) specified in Schedule 2, including encryption, access controls, and vulnerability scanning.</li>
              <li>Assist the Merchant in responding to requests for exercising data subject rights laid down in Chapter III of the GDPR.</li>
              <li>Notify the Merchant without undue delay, and in any event within <strong>48 hours</strong>, after becoming aware of a confirmed Personal Data Breach.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">3. Technical and Organizational Measures (TOMs)</h2>
            <p>Storefront Ops implements the following core security controls:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pseudonymization &amp; Encryption:</strong> All stored data encrypted with AES-256; TLS 1.3 in transit with HSTS enforced.</li>
              <li><strong>Tenant Partitioning:</strong> Hardware-level and database-level Row-Level Security ensuring strict boundary isolation between customers.</li>
              <li><strong>Continuous Auditing:</strong> Immutable audit logging of all data mutation operations and administrative access.</li>
              <li><strong>Resilience &amp; Backups:</strong> Point-In-Time Recovery (PITR) with RPO &lt; 5 minutes and RTO &lt; 30 minutes.</li>
            </ul>
          </section>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-black">Need a countersigned enterprise DPA?</p>
            <p className="text-zinc-600">Download or request a signed digital copy for your data protection officer.</p>
          </div>
          <a
            href="mailto:dpo@storefrontops.com?subject=Enterprise%20DPA%20Request"
            className="rounded-lg bg-black px-4 py-2 font-bold text-white hover:bg-zinc-800 transition-colors"
          >
            Request Signed DPA
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
