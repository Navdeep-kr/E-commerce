'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ArrowRight } from 'lucide-react';

export function PublicNav() {
  return (
    <nav className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 text-black">
      <div className="w-full px-6 sm:px-10 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-black text-xs shadow-xs">
            SO
          </div>
          <span className="font-bold text-base tracking-tight text-black">Storefront Ops</span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-green-700 border border-green-300">
            v2.4 GA
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-600">
          <a href="/#features" className="hover:text-black transition-colors">Features</a>
          <a href="/#demo" className="hover:text-black transition-colors">Interactive Demo</a>
          <a href="/#pricing" className="hover:text-black transition-colors">Pricing &amp; Plans</a>
          <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-bold text-black hover:text-zinc-700 px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-black hover:bg-zinc-800 text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
