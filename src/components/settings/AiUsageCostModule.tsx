// src/components/settings/AiUsageCostModule.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import {
  DollarSign,
  Cpu,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

interface UsageRecord {
  id: string;
  date: string;
  reviewer: string;
  rating: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  status: 'published' | 'approved';
}

const SAMPLE_USAGE_LOGS: UsageRecord[] = [
  {
    id: 'log-1',
    date: '2024-03-15 14:22',
    reviewer: 'Marcus Vance',
    rating: 5,
    model: 'claude-3-5-sonnet',
    promptTokens: 490,
    completionTokens: 240,
    totalTokens: 730,
    cost: 0.0051,
    status: 'published',
  },
  {
    id: 'log-2',
    date: '2024-03-15 11:05',
    reviewer: 'Elena Rostova',
    rating: 5,
    model: 'claude-3-5-sonnet',
    promptTokens: 512,
    completionTokens: 215,
    totalTokens: 727,
    cost: 0.0048,
    status: 'published',
  },
  {
    id: 'log-3',
    date: '2024-03-14 18:40',
    reviewer: 'David K.',
    rating: 2,
    model: 'claude-3-5-sonnet',
    promptTokens: 620,
    completionTokens: 310,
    totalTokens: 930,
    cost: 0.0065,
    status: 'published',
  },
  {
    id: 'log-4',
    date: '2024-03-14 09:12',
    reviewer: 'Sophia Chen',
    rating: 4,
    model: 'claude-3-5-sonnet',
    promptTokens: 480,
    completionTokens: 190,
    totalTokens: 670,
    cost: 0.0043,
    status: 'published',
  },
  {
    id: 'log-5',
    date: '2024-03-13 16:33',
    reviewer: 'Arthur Pendelton',
    rating: 5,
    model: 'claude-3-5-sonnet',
    promptTokens: 530,
    completionTokens: 220,
    totalTokens: 750,
    cost: 0.0049,
    status: 'published',
  },
];

export const AiUsageCostModule: React.FC = () => {
  const { activeRole, currentUser, pricingPlans, addToast, navigate } = usePartner();

  const userPlan = pricingPlans.find((p) => p.id === currentUser.planId) || pricingPlans[0];
  const isSingleUser = activeRole === 'single';

  // Metrics based on role
  const repliesUsed = isSingleUser ? 248 : 840;
  const repliesQuota = userPlan.aiReplyQuota || (isSingleUser ? 250 : 2000);
  const percentUsed = Math.min(100, Math.round((repliesUsed / repliesQuota) * 100));

  const totalTokens = isSingleUser ? 184250 : 640100;
  const estimatedCost = isSingleUser ? 1.42 : 4.88;

  const [budgetAlertLimit, setBudgetAlertLimit] = useState(15.0);
  const [budgetAlertModalOpen, setBudgetAlertModalOpen] = useState(false);

  const handleExportCsv = () => {
    const headers = 'ID,Date,Reviewer,Rating,Model,PromptTokens,CompletionTokens,TotalTokens,CostUSD,Status\n';
    const rows = SAMPLE_USAGE_LOGS.map(
      (r) =>
        `${r.id},${r.date},"${r.reviewer}",${r.rating},${r.model},${r.promptTokens},${r.completionTokens},${r.totalTokens},${r.cost},${r.status}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `partnerai-ai-usage-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Usage Ledger Exported',
      description: 'Downloaded CSV report of all LLM token and cost transactions.',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink">AI Usage & LLM Cost Analytics</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                Billing Cycle: Current Month
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Transparent per-token pricing and monthly volume quota monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <button
            type="button"
            onClick={() => setBudgetAlertModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-muted text-ink border border-surface-border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Budget Alert (${budgetAlertLimit})</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quota Alert if near capacity */}
      {percentUsed >= 95 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                You have used {percentUsed}% of your included monthly AI review replies
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Only {repliesQuota - repliesUsed} replies remaining on the {userPlan.name}. Upgrade your plan to prevent automated replies from pausing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(activeRole === 'agency' ? '/agency/settings/plan' : '/user/settings/plan')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs self-start sm:self-center"
          >
            Upgrade Plan Now
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
          <p className="text-xs font-semibold text-ink-muted">AI Replies Generated</p>
          <p className="text-2xl font-black text-ink mt-1">
            {repliesUsed.toLocaleString()}
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-ink-muted">Plan Limit</span>
              <span className="font-bold text-ink">{repliesUsed} / {repliesQuota}</span>
            </div>
            <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  percentUsed > 90 ? 'bg-amber-500' : 'bg-brand-500'
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
          <p className="text-xs font-semibold text-ink-muted">Total LLM Tokens</p>
          <p className="text-2xl font-black text-ink mt-1">
            {(totalTokens / 1000).toFixed(1)}k
          </p>
          <p className="text-[11px] text-ink-muted mt-2">
            Prompt: {((totalTokens * 0.67) / 1000).toFixed(0)}k • Completion: {((totalTokens * 0.33) / 1000).toFixed(0)}k
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
          <p className="text-xs font-semibold text-ink-muted">Estimated AI Cost</p>
          <p className="text-2xl font-black text-brand-700 mt-1">
            ${estimatedCost.toFixed(2)} USD
          </p>
          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium inline-block mt-2">
            Included in your plan quota
          </span>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
          <p className="text-xs font-semibold text-ink-muted">Avg. Latency / Response</p>
          <p className="text-2xl font-black text-ink mt-1">
            340 ms
          </p>
          <span className="text-[11px] text-ink-muted mt-2 block">
            Model: Claude 3.5 Sonnet
          </span>
        </div>
      </div>

      {/* Cost Breakdown & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            Generation Breakdown
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">5-Star Praises</span>
                <span className="font-mono text-brand-700 font-semibold">$0.71</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">142 replies • 85,200 tokens</p>
            </div>

            <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">4-Star Positive</span>
                <span className="font-mono text-brand-700 font-semibold">$0.38</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">68 replies • 44,200 tokens</p>
            </div>

            <div className="p-3 bg-surface-muted rounded-xl border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">1-3 Star Remediation</span>
                <span className="font-mono text-brand-700 font-semibold">$0.33</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">38 replies • 54,850 tokens (thorough response)</p>
            </div>
          </div>
        </div>

        {/* Audit Log / Ledger */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              Recent AI Generation Ledger
            </h4>
            <span className="text-[11px] text-ink-muted">Live Stream</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted text-[11px]">
                  <th className="pb-2 font-semibold">Date & Time</th>
                  <th className="pb-2 font-semibold">Reviewer</th>
                  <th className="pb-2 font-semibold">Rating</th>
                  <th className="pb-2 font-semibold">Tokens</th>
                  <th className="pb-2 font-semibold">Cost</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {SAMPLE_USAGE_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="py-2.5 font-mono text-[11px] text-ink-muted">{log.date}</td>
                    <td className="py-2.5 font-bold text-ink">{log.reviewer}</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px]">
                        ★ {log.rating}.0
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-ink">{log.totalTokens}</td>
                    <td className="py-2.5 font-mono text-[11px] text-brand-700 font-semibold">
                      ${log.cost.toFixed(4)}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Published
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Alert Modal */}
      {budgetAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Set Monthly AI Spending Threshold
            </h4>
            <p className="text-xs text-ink-muted">
              We will send an instant email notification if monthly token costs exceed this limit.
            </p>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Monthly Alert Cap ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-ink-muted">$</span>
                <input
                  type="number"
                  step="1"
                  value={budgetAlertLimit}
                  onChange={(e) => setBudgetAlertLimit(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-surface border border-surface-border rounded-xl font-bold text-ink"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBudgetAlertModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBudgetAlertModalOpen(false);
                  addToast({
                    type: 'success',
                    title: 'Spending alert configured',
                    description: `You will be alerted if AI generation expenses exceed $${budgetAlertLimit}/month.`,
                  });
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
