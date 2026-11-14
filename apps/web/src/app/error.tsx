'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log exception to telemetry / monitoring
    console.error('⚠️ [Storefront Ops] Unhandled runtime exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black select-text">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center font-black text-white text-base shadow-sm">
          <span className="text-white font-bold">SO</span>
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-black">Storefront Ops</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#dc2626] text-white">
            System Error
          </span>
        </div>
      </div>

      {/* Error Card */}
      <div className="max-w-lg w-full bg-white border border-black/10 rounded-2xl p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#dc2626]/10 text-[#dc2626] mb-5">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-black mb-2 tracking-tight">
          An Unexpected Error Occurred
        </h1>
        <p className="text-black/60 text-sm leading-relaxed mb-6">
          The operational subsystem encountered an issue processing your request. Your persistent data and inventory states remain safeguarded.
        </p>

        {error.digest && (
          <div className="mb-6 p-3 rounded-lg bg-black/5 border border-black/10 text-xs font-mono text-black/70 break-all">
            Incident Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-black/90 transition-all shadow-sm active:scale-[0.98]"
          >
            <span className="text-white font-semibold">Try Again</span>
          </button>
          <Link
            href="/acme-commerce"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-black border border-black/20 font-semibold text-sm hover:bg-black/5 transition-all active:scale-[0.98]"
          >
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>

      {/* Support Status */}
      <div className="mt-8 flex items-center gap-2 text-xs text-black/50">
        <span>If this persists, please contact your organization administrator or Storefront Ops Support.</span>
      </div>
    </div>
  );
}
