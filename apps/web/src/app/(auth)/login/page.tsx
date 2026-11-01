'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Loader2 } from 'lucide-react';

const QUICK_ROLES = [
  { id: 'admin', label: 'Owner / Admin', email: 'admin@acmecommerce.com', role: 'owner_admin' },
  { id: 'manager', label: 'E-Comm Manager', email: 'manager@acmecommerce.com', role: 'manager' },
  { id: 'fulfillment', label: 'Fulfillment Lead', email: 'warehouse@acmecommerce.com', role: 'fulfillment' },
  { id: 'purchasing', label: 'Purchasing Planner', email: 'purchasing@acmecommerce.com', role: 'purchasing' },
  { id: 'marketing', label: 'Marketing Lead', email: 'marketing@acmecommerce.com', role: 'marketing' },
  { id: 'support', label: 'Customer Support', email: 'support@acmecommerce.com', role: 'support' },
  { id: 'finance', label: 'Finance Controller', email: 'finance@acmecommerce.com', role: 'finance' },
  { id: 'viewer', label: 'Read-Only Viewer', email: 'viewer@acmecommerce.com', role: 'viewer' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@acmecommerce.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      router.push(data.redirectUrl || '/acme-commerce/today');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectQuickRole(r: typeof QUICK_ROLES[0]) {
    setSelectedRole(r.id);
    setEmail(r.email);
    setPassword('password123');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-black">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700 border border-green-300">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Storefront Ops Security</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black">Sign in to your Workspace</h1>
          <p className="text-xs text-zinc-600">
            Multi-tenant e-commerce operations with server-enforced RBAC.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-white p-3 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-black">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-black placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-2.5 text-xs font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            <span>Sign In</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs">
          <span className="text-zinc-600">Don't have an account? </span>
          <Link href="/signup" className="font-bold text-black hover:underline">
            Create a workspace
          </Link>
        </div>

        <div className="border-t border-zinc-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Instant Persona Switcher (For Evaluation &amp; QA)
            </span>
            <UserCheck className="h-3.5 w-3.5 text-zinc-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUICK_ROLES.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectQuickRole(r)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    isSelected
                      ? 'border-black bg-zinc-50 text-black font-bold'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-black hover:text-black'
                  }`}
                >
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">{r.email}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
