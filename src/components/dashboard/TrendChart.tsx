// src/components/dashboard/TrendChart.tsx
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { usePartner } from '../../lib/store';
import {
  Calendar,
  Eye,
  PhoneCall,
  Navigation,
  MousePointerClick,
  Loader2,
  Info,
} from 'lucide-react';

interface TrendChartProps {
  title?: string;
  period: '7d' | '30d' | '90d';
  onPeriodChange: (p: '7d' | '30d' | '90d') => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title = 'Search Impressions & Customer Actions',
  period,
  onPeriodChange,
}) => {
  const [metric, setMetric] = useState<'views' | 'interactions'>('views');
  const { getTrendSeries } = usePartner();

  // Real points from /api/kpis/timeseries. `loading` is the first fetch;
  // `engagementAvailable` is false until a GBP account is actually connected,
  // which is why the engagement lines can legitimately sit at zero.
  const { series: data, loading, engagementAvailable } = getTrendSeries(period);

  const hasEngagement = data.some(
    (d) => d.views || d.searches || d.calls || d.directions || d.clicks
  );

  // Footer totals are summed from the same series the chart draws — they used
  // to be four hardcoded numbers with invented trend percentages.
  const sum = (key: 'views' | 'calls' | 'directions' | 'clicks') =>
    data.reduce((total, point) => total + (point[key] || 0), 0);

  const totals = [
    { label: 'Total Impressions', value: sum('views'), Icon: Eye },
    { label: 'Direct Phone Calls', value: sum('calls'), Icon: PhoneCall },
    { label: 'Driving Directions', value: sum('directions'), Icon: Navigation },
    { label: 'Website Visits', value: sum('clicks'), Icon: MousePointerClick },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {loading
              ? 'Loading performance metrics…'
              : engagementAvailable
                ? 'Performance metrics synced from the Google Business Profile API'
                : 'Review and post activity from your account'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Toggle */}
          <div className="flex items-center bg-surface-muted p-1 rounded-xl border border-surface-border text-xs">
            <button
              type="button"
              onClick={() => setMetric('views')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                metric === 'views'
                  ? 'bg-surface text-brand-700 shadow-xs border border-brand-200'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Impressions & Search
            </button>
            <button
              type="button"
              onClick={() => setMetric('interactions')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                metric === 'interactions'
                  ? 'bg-surface text-brand-700 shadow-xs border border-brand-200'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Calls & Directions
            </button>
          </div>

          {/* Date Range Picker Tabs */}
          <div className="flex items-center bg-surface-muted p-1 rounded-xl border border-surface-border text-xs">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  period === p
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading metrics…</span>
          </div>
        ) : !data.length ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-muted">
            <Info className="w-5 h-5" />
            <span className="text-xs">No activity in this period yet.</span>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'views' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="searchesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#86efac" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#86efac" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                name="Maps Views"
                stroke="#16a34a"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#viewsGradient)"
              />
              <Area
                type="monotone"
                dataKey="searches"
                name="Search Queries"
                stroke="#4ade80"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#searchesGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="calls" name="Phone Calls" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="directions"
                name="Direction Requests"
                fill="#86efac"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="clicks"
                name="Website Clicks"
                fill="#bbf7d0"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
        )}
      </div>

      {/* Engagement counters come from Google; say so rather than showing
          unexplained zeros before a profile is connected. */}
      {!loading && data.length > 0 && !hasEngagement && !engagementAvailable && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-surface-border bg-surface-muted px-3 py-2 text-[11px] text-ink-muted">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Impressions, calls, directions and clicks come from the Google Business
            Profile API. Connect a location in Settings to populate them.
          </span>
        </div>
      )}

      {/* Footer Metrics highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-surface-border">
        {totals.map(({ label, value, Icon }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-ink-muted">{label}</p>
              <p className="text-sm font-bold text-ink">
                {loading ? '—' : value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
