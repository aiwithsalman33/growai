// src/components/dashboard/KpiCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: number; // e.g. +14.2
  icon: React.ReactNode;
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  trend,
  icon,
  highlight = false,
}) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all ${
        highlight
          ? 'bg-gradient-to-br from-brand-50 to-surface border-brand-200 shadow-xs'
          : 'bg-surface border-surface-border hover:border-brand-200/80 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-ink-muted tracking-tight">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-ink">{value}</p>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-brand-100 text-brand-800'
                : isNegative
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-ink-muted'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {trend}%
            </span>
          </div>
        )}
      </div>

      {subtext && <p className="text-[11px] text-ink-muted mt-1.5">{subtext}</p>}
    </div>
  );
};
