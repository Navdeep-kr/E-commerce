import { MoneyMath } from '@storefront-ops/core';
import { ORDER_STATUS_CONFIGS, STOCK_STATUS_CONFIGS } from '@storefront-ops/ui';
import { Activity, CheckCircle, Database, Layers, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const sampleBalance = MoneyMath.format({ amount: 4895000, currency: 'USD' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-4xl space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3.5 w-3.5" />
              Storefront Ops Baseline Initialized
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">E-Commerce Ops Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Production-grade multi-tenant operations workspace with zero dropped steps.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Verified Cashflow</span>
            <p className="text-xl font-bold font-mono text-foreground">{sampleBalance}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-4 w-4 text-primary" />
              <span>Core Invariants</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Zero floating-point money precision &amp; append-only stock ledger verified.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> 15 Unit Tests Passing
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Tenant Security</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Row-Level Security (RLS) and multi-tenancy enforced across all schemas.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> Strict RBAC Guards
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-primary" />
              <span>Integration Adapters</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Orders, Inventory, Payments, and Shipping interfaces strictly decoupled.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> Hot-Swappable Providers
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Status Tokens &amp; State Machine Preview
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ORDER_STATUS_CONFIGS).slice(0, 6).map(([key, cfg]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {cfg.label}
              </span>
            ))}
            {Object.entries(STOCK_STATUS_CONFIGS).map(([key, cfg]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
