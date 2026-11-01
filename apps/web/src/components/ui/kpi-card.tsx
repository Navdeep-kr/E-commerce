import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  previousValue?: string;
  changePercent?: number;
  periodLabel?: string;
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
  icon,
  alert = false,
  className = '',
}: KPICardProps) {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
        alert ? 'border-amber-500/50 bg-amber-500/5' : 'border-border'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>

        {changePercent !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isNegative
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isPositive && <ArrowUpRight className="h-3 w-3" />}
            {isNegative && <ArrowDownRight className="h-3 w-3" />}
            {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
            <span>{Math.abs(changePercent)}%</span>
          </div>
        )}
      </div>

      {(previousValue || periodLabel) && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {previousValue && <span className="font-mono">{previousValue} </span>}
          <span>{periodLabel}</span>
        </div>
      )}
    </div>
  );
}
