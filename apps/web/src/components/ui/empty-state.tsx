'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4 bg-white text-black">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-black mx-auto border border-zinc-200 shadow-xs">
        <Icon className="h-7 w-7 text-black stroke-[1.5]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-black tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          {primaryAction &&
            (primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                {primaryAction.icon ? <primaryAction.icon className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{primaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
              >
                {primaryAction.icon ? <primaryAction.icon className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{primaryAction.label}</span>
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-50 transition-colors"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-50 transition-colors"
              >
                <span>{secondaryAction.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
