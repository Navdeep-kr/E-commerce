'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string;
  previousValue?: string;
  changePercent?: number;
  periodLabel?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  alert?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  previousValue,
  changePercent,
  periodLabel = 'vs previous period',
  description,
  trend,
  icon,
  alert = false,
  className = '',
}: KPICardProps) {
  // Support both changePercent and trend object
  const effectiveChange = trend ? trend.value : changePercent;
  const isPositive = trend
    ? trend.isPositive ?? trend.value > 0
    : changePercent !== undefined && changePercent > 0;
  const isNegative = trend
    ? !isPositive && trend.value !== 0
    : changePercent !== undefined && changePercent < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
        alert ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-black">{title}</span>
        {icon && <div className="text-zinc-700">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-black font-mono tracking-tight text-black">{value}</div>

        {effectiveChange !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isNegative
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}
          >
            {isPositive && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />}
            {isNegative && <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />}
            {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-orange-600" />}
            <span>{Math.abs(effectiveChange)}%</span>
          </div>
        )}
      </div>

      {description && (
        <div className="mt-2 text-xs font-medium text-zinc-600">{description}</div>
      )}

      {!description && (previousValue || periodLabel) && (
        <div className="mt-2 text-[11px] font-medium text-zinc-600">
          {previousValue && <span className="font-mono text-black font-semibold">{previousValue} </span>}
          <span>{periodLabel}</span>
        </div>
      )}
    </div>
  );
}

// Export explicit function component alias for backwards compatibility
export function KpiCard(props: KPICardProps) {
  return <KPICard {...props} />;
}

export default KPICard;
