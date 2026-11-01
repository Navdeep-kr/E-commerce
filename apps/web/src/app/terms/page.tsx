'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public/public-nav';
import { PublicFooter } from '@/components/public/public-footer';
import { FileText, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
              LEGAL DOCUMENT
            </span>
            <span className="text-xs text-zinc-500 font-medium">Effective Date: November 1, 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black">Master Terms of Service</h1>
          <p className="text-sm text-zinc-600">
            Please read these terms carefully before accessing or using the Storefront Ops platform.
          </p>
        </div>

        <div className="prose prose-zinc max-w-none text-xs leading-relaxed space-y-6 text-zinc-800">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">1. Provision of Services &amp; Multi-Tenant Isolation</h2>
            <p>
              Storefront Ops Inc. (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;) provides a cloud-based multi-tenant e-commerce operations software platform designed for fulfillment, inventory planning, customer support, and financial reporting. Subject to Customer&apos;s compliance with this Agreement and payment of applicable subscription fees, Company grants Customer a non-exclusive, non-transferable right to access and use the Platform.
            </p>
            <p>
              Each Customer workspace operates under isolated tenant boundaries enforced by server-side PostgreSQL Row-Level Security (RLS). Customer shall not attempt to access, probe, or interact with data belonging to other organizations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">2. Service Level Agreement (SLA) &amp; Uptime Guarantee</h2>
            <p>
              Company will use commercially reasonable efforts to make the Platform available with an Uptime Commitment of at least <strong>99.9%</strong> during each monthly billing cycle, excluding scheduled maintenance windows notified at least 48 hours in advance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">3. Subscription, Billing &amp; Usage Quotas</h2>
            <p>
              Services are provided under tiered monthly or annual subscription plans (Starter, Growth, Scale) as described in the billing documentation. Subscriptions are billed in advance via credit card or authorized payment method processed securely through Stripe. All fees are denominated and charged in integer minor units (USD cents) and are non-refundable.
            </p>
            <p>
              If payment processing fails, Customer is granted a <strong>7-day grace period</strong> during which operational write capabilities remain active. If payment is not resolved within 7 days, Customer&apos;s workspace is downgraded to read-only status until outstanding balances are cleared.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">4. Customer Data Ownership &amp; Intellectual Property</h2>
            <p>
              As between the parties, Customer owns all right, title, and interest in and to all data, catalog items, orders, customer records, and financial transactions entered into the Platform (&quot;Customer Data&quot;).
            </p>
            <p>
              Company implements and maintains technical and organizational measures (TOMs) designed to protect Customer Data against unauthorized access, loss, or destruction, as specified in our Data Processing Addendum (DPA).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-black uppercase tracking-wider">5. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT. COMPANY&apos;S TOTAL CUMULATIVE LIABILITY SHALL BE LIMITED TO THE TOTAL FEES PAID BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-black">Questions regarding these terms?</p>
            <p className="text-zinc-600">Contact our legal compliance team at legal@storefrontops.com</p>
          </div>
          <Link
            href="/signup"
            className="rounded-lg bg-black px-4 py-2 font-bold text-white hover:bg-zinc-800 transition-colors"
          >
            Agree &amp; Get Started
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
