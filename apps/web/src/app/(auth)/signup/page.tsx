'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, organizationName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create workspace');
      }

      router.push(data.redirectUrl || '/');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-black">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600 border border-orange-300">
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            <span>Multi-Tenant Workspace Setup</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Create Your Ops Workspace</h1>
          <p className="text-xs text-zinc-600">
            Get started with your entire retail operations team in 2 minutes.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-white p-3 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Your Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Organization / Company Name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Peak Athletics Co."
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Password (min 8 characters)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span>Create Workspace</span>
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 text-center text-xs">
          <span className="text-zinc-600">Already have an account? </span>
          <Link href="/login" className="font-bold text-black hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
