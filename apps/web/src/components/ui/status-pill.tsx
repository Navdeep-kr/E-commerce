'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertOctagon,
  PackageOpen,
  Box,
  PackageCheck,
  Truck,
  CheckCheck,
  Ban,
  RotateCcw,
  Boxes,
  Check,
  AlertTriangle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { ORDER_STATUS_CONFIGS, STOCK_STATUS_CONFIGS, type StatusVariant } from '@storefront-ops/ui';

interface StatusPillProps {
  status: string;
  type?: 'order' | 'stock';
  className?: string;
  showIcon?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Clock,
  CheckCircle2,
  AlertOctagon,
  PackageOpen,
  Box,
  PackageCheck,
  Truck,
  CheckCheck,
  Ban,
  RotateCcw,
  Boxes,
  Check,
  AlertTriangle,
  AlertCircle,
  Layers,
};

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80 font-semibold',
  info: 'bg-zinc-100 text-zinc-900 border-zinc-200 font-semibold',
  neutral: 'bg-zinc-50 text-zinc-700 border-zinc-200 font-medium',
};

const DOT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-zinc-900',
  neutral: 'bg-zinc-400',
};

export function StatusPill({ status, type = 'order', className = '', showIcon = false }: StatusPillProps) {
  const configs = type === 'order' ? ORDER_STATUS_CONFIGS : STOCK_STATUS_CONFIGS;
  const config = configs[status] || {
    label: status.replace(/_/g, ' '),
    variant: 'neutral',
    iconName: 'Clock',
  };

  const IconComponent = ICON_MAP[config.iconName] || Clock;
  const variantClass = VARIANT_STYLES[config.variant] || VARIANT_STYLES.neutral;
  const dotClass = DOT_STYLES[config.variant] || DOT_STYLES.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantClass} shadow-2xs whitespace-nowrap ${className}`}
      role="status"
      aria-label={`${type} status: ${config.label}`}
    >
      {showIcon ? (
        <IconComponent className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
}

export default StatusPill;
