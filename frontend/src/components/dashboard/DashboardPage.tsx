// src/components/dashboard/DashboardPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { KpiCard } from './KpiCard';
import { TrendChart } from './TrendChart';
import { ClientComparisonTable } from './ClientComparisonTable';
import {
  Eye,
  PhoneCall,
  Navigation,
  MousePointerClick,
  Star,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building2,
  AlertCircle
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    activeRole,
    activeGbpAccount,
    userGbpAccounts,
    navigate,
    getKpisForAccount,
    posts,
    reviews,
    generateAiReply,
    replyToReview,
  } = usePartner();

  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [generatingForReviewId, setGeneratingForReviewId] = useState<string | null>(null);

  const kpis = getKpisForAccount(activeRole === 'agency' ? 'all' : activeGbpAccount?.id || '', period);

  // Unreplied reviews for active profile
  const pendingReviews = reviews.filter(
    (r) => (activeRole === 'single' ? r.gbpAccountId === activeGbpAccount?.id : true) && !r.replyText
  );

  const handleQuickAiReply = async (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;
    setGeneratingForReviewId(reviewId);
    const reply = await generateAiReply(review);
    await replyToReview(reviewId, reply, 'ai');
    setGeneratingForReviewId(null);
  };

  const basePath = activeRole === 'agency' ? '/agency' : '/user';

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight truncate">
              {activeRole === 'agency'
                ? 'Agency Overview & Client Analytics'
                : `${activeGbpAccount?.clientLabel || activeGbpAccount?.locationName}`}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200 shrink-0">
              Live GBP Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 truncate">
            {activeRole === 'agency'
              ? `Aggregated performance across ${userGbpAccounts.length} client locations`
              : `${activeGbpAccount?.address} • ${activeGbpAccount?.category}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/posts/new`)}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> <span>Create GBP Post</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/reviews`)}
            className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 bg-surface hover:bg-surface-muted text-ink border border-surface-border text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-brand-600" /> <span>Reviews Inbox</span>
            {pendingReviews.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingReviews.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid: 2 cols on mobile, 3 on small tablet, 4 on medium, 7 on wide desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        <KpiCard
          title="Total Views"
          value={kpis.views.toLocaleString()}
          subtext="Maps & Search impressions"
          trend={kpis.viewsTrend}
          icon={<Eye className="w-4 h-4" />}
          highlight
        />
        <KpiCard
          title="Phone Calls"
          value={kpis.calls.toLocaleString()}
          subtext="Direct calls made"
          trend={kpis.callsTrend}
          icon={<PhoneCall className="w-4 h-4" />}
        />
        <KpiCard
          title="Directions"
          value={kpis.directionRequests.toLocaleString()}
          subtext="Maps routes started"
          trend={kpis.directionsTrend}
          icon={<Navigation className="w-4 h-4" />}
        />
        <KpiCard
          title="Website Clicks"
          value={kpis.websiteClicks.toLocaleString()}
          subtext="Referrals to website"
          trend={kpis.clicksTrend}
          icon={<MousePointerClick className="w-4 h-4" />}
        />
        <KpiCard
          title="Average Rating"
          value={`${kpis.avgRating.toFixed(1)} ★`}
          subtext="Customer sentiment"
          icon={<Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
        />
        <KpiCard
          title="Total Reviews"
          value={kpis.reviewCount}
          subtext="Verified customers"
          icon={<MessageSquare className="w-4 h-4" />}
        />
        <KpiCard
          title="Active Posts"
          value={kpis.postCount}
          subtext="This month"
          icon={<FileText className="w-4 h-4" />}
        />
      </div>

      {/* Main Charts & Quick Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Interactive Trend Chart */}
        <div className="lg:col-span-2">
          <TrendChart
            period={period}
            onPeriodChange={setPeriod}
            title={
              activeRole === 'agency'
                ? 'Consolidated Traffic & Action Trends'
                : 'Customer Discovery & Interaction Trends'
            }
          />
        </div>

        {/* Right Column: AI Review Assistant & Health Checklist */}
        <div className="space-y-6">
          {/* AI Reviews Needs Attention Card */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-ink">AI Review Assistant</h3>
              </div>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                Auto-Guardrails Active
              </span>
            </div>

            {pendingReviews.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-ink-muted">
                  {pendingReviews.length} new review{pendingReviews.length > 1 ? 's' : ''} require attention.
                  One-click AI reply generated according to your persona rules.
                </p>

                {pendingReviews.slice(0, 2).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-surface-muted rounded-xl border border-surface-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">{rev.reviewerName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-2 italic">
                      "{rev.text}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => navigate(`${basePath}/reviews`)}
                        className="text-[11px] font-medium text-ink-muted hover:text-ink"
                      >
                        Inspect Review
                      </button>
                      <button
                        type="button"
                        disabled={generatingForReviewId === rev.id}
                        onClick={() => handleQuickAiReply(rev.id)}
                        className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3" />
                        {generatingForReviewId === rev.id ? 'Generating...' : 'One-Click AI Reply'}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/reviews`)}
                  className="w-full py-2 text-center text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
                >
                  View all in Reviews Inbox &rarr;
                </button>
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">All reviews replied to!</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  100% response rate maintained over the last 30 days.
                </p>
              </div>
            )}
          </div>

          {/* Profile Health Score */}
          <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink">GBP Profile Health</h3>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                {activeGbpAccount?.healthScore || 92}% Optimal
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${activeGbpAccount?.healthScore || 92}%` }}
              />
            </div>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-ink">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Primary category and hours updated</span>
              </li>
              <li className="flex items-center gap-2 text-ink">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Google Maps OAuth credentials verified</span>
              </li>
              <li className="flex items-center gap-2 text-ink">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>AI review tone script defined in settings</span>
              </li>
              <li className="flex items-center gap-2 text-ink">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Weekly post published on schedule</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Agency Mode: Per-Client Comparison Table */}
      {activeRole === 'agency' && (
        <div className="pt-2">
          <ClientComparisonTable />
        </div>
      )}
    </div>
  );
};
