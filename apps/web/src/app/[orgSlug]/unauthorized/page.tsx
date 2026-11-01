'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react';

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const fromModule = searchParams.get('from') || 'this page';
  const orgSlug = (params?.orgSlug as string) || 'acme-commerce';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-8 shadow-sm text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Permission Denied (403)</h1>
          <p className="text-sm text-muted-foreground">
            Your current role does not have permission to view or manage <span className="font-semibold text-foreground uppercase">{fromModule}</span>.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 text-left space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Server-Enforced Role Security</span>
          </div>
          <p>
            Role permissions are evaluated on the server. If you require access to this module, contact an <strong>Owner/Admin</strong> or <strong>Manager</strong> to adjust your team role.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href={`/${orgSlug}/today`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2 px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Today Dashboard</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors pt-1"
          >
            Switch to a different user role
          </Link>
        </div>
      </div>
    </div>
  );
}
