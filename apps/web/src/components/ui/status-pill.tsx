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
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  neutral: 'bg-muted text-muted-foreground border-border',
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
