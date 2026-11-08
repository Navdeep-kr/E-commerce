'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-black py-12 px-6">
      <div className="w-full px-6 sm:px-10 lg:px-16 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white font-black text-xs select-none">
              <span className="text-white font-black text-xs leading-none">SO</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-black">Storefront Ops</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            The mission-critical operations operating system for modern omnichannel e-commerce brands.
          </p>
          <div className="flex items-center gap-2 pt-2 text-[11px] text-green-700 font-bold">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>SOC 2 Type II Certified &amp; GDPR Compliant</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">Platform Modules</h4>
          <ul className="space-y-2 text-xs text-zinc-600 font-medium">
            <li><Link href="/login" className="hover:text-black">Omnichannel Orders</Link></li>
            <li><Link href="/login" className="hover:text-black">Wave Picking &amp; Pack Station</Link></li>
            <li><Link href="/login" className="hover:text-black">Multi-Node Inventory</Link></li>
            <li><Link href="/login" className="hover:text-black">Automated Returns (RMA)</Link></li>
            <li><Link href="/login" className="hover:text-black">Purchasing &amp; 3-Way Matching</Link></li>
            <li><Link href="/login" className="hover:text-black">Double-Entry Financial Ledger</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">Architecture &amp; Trust</h4>
          <ul className="space-y-2 text-xs text-zinc-600 font-medium">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> PostgreSQL Row-Level Security</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Append-Only Stock Movements</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Integer Minor Units (Zero Floats)</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Cryptographic HMAC Webhooks</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> 99.9% Uptime Guarantee</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">Legal &amp; Compliance</h4>
          <ul className="space-y-2 text-xs text-zinc-600 font-medium">
            <li><Link href="/terms" className="hover:text-black">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-black">Privacy Policy</Link></li>
            <li><Link href="/dpa" className="hover:text-black">Data Processing Addendum (DPA)</Link></li>
            <li><Link href="/login" className="hover:text-black">Sub-Processors Registry</Link></li>
            <li><Link href="/login" className="hover:text-black">Security Bug Bounty</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full px-6 sm:px-10 lg:px-16 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
        <div>&copy; {new Date().getFullYear()} Storefront Ops Inc. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
          <span className="text-black font-semibold">All Systems Operational</span>
        </div>
      </div>
    </footer>
  );
}
