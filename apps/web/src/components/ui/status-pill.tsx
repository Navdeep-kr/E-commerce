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
  success: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold', // Green
  warning: 'bg-orange-50 text-orange-700 border-orange-300 font-semibold',   // Orange
  danger: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',          // Red
  info: 'bg-orange-50 text-orange-700 border-orange-300 font-semibold',       // Orange / in-progress
  neutral: 'bg-zinc-50 text-black border-zinc-300 font-medium',              // Black
};

export function StatusPill({ status, type = 'order', className = '' }: StatusPillProps) {
  const configs = type === 'order' ? ORDER_STATUS_CONFIGS : STOCK_STATUS_CONFIGS;
  const config = configs[status] || {
    label: status.replace(/_/g, ' '),
    variant: 'neutral',
    iconName: 'Clock',
  };

  const IconComponent = ICON_MAP[config.iconName] || Clock;
  const variantClass = VARIANT_STYLES[config.variant] || VARIANT_STYLES.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${variantClass} ${className}`}
      role="status"
      aria-label={`${type} status: ${config.label}`}
    >
      <IconComponent className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export default StatusPill;

