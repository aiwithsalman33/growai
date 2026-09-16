// src/components/reviews/ReviewsPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { ReviewCard } from './ReviewCard';
import {
  MessageSquare,
  Star,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { reviews, activeGbpAccount, aiConfigs, updateAiConfig, navigate, activeRole } = usePartner();

  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REPLIED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const config = aiConfigs[activeGbpAccount?.id || ''] || aiConfigs['gbp-artisan'];

  // Filter by active GBP account
  const accountReviews = reviews.filter(
    (r) => !activeGbpAccount || r.gbpAccountId === activeGbpAccount.id
  );

  const filteredReviews = accountReviews.filter((review) => {
    const matchesRating = ratingFilter === 'ALL' || review.rating === ratingFilter;
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? !review.replyText
        : !!review.replyText;
    const matchesSearch =
      review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRating && matchesStatus && matchesSearch;
  });

  const pendingCount = accountReviews.filter((r) => !r.replyText).length;
  const repliedCount = accountReviews.filter((r) => !!r.replyText).length;
  const avgRating =
    accountReviews.length > 0
      ? (
          accountReviews.reduce((acc, curr) => acc + curr.rating, 0) /
          accountReviews.length
        ).toFixed(1)
      : '5.0';

  const handleToggleAutoReply = async () => {
    if (!activeGbpAccount) return;
    await updateAiConfig(activeGbpAccount.id, {
      autoReplyEnabled: !config?.autoReplyEnabled,
    });
  };

  const basePath = activeRole === 'agency' ? '/agency' : '/user';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Reviews Inbox & AI Agent</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 shrink-0">
              {accountReviews.length} Reviews
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Respond to Google Maps reviews with automated or one-click brand-aligned AI drafted replies.
          </p>
        </div>

        {/* Persona settings quick link */}
        <button
          type="button"
          onClick={() => navigate(`${basePath}/settings/ai-agent`)}
          className="self-start sm:self-auto px-3.5 py-2 bg-surface hover:bg-surface-muted text-ink border border-surface-border text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Settings className="w-3.5 h-3.5 text-brand-600" /> Configure AI Persona Script
        </button>
      </div>

      {/* Auto-Reply Guardrails Banner */}
      <div className="bg-gradient-to-r from-brand-50 to-surface rounded-2xl border border-brand-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-ink">AI Auto-Reply Automation Engine</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                  config?.autoReplyEnabled
                    ? 'bg-brand-200 text-brand-900'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {config?.autoReplyEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Guardrail rule: Automatically send AI replies only for ratings ≥{' '}
              <span className="font-bold text-ink">{config?.autoReplyMinRating || 4} Stars</span>.
              Lower ratings are always drafted for manual verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config?.autoReplyEnabled || false}
              onChange={handleToggleAutoReply}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
          <span className="text-xs font-semibold text-ink">
            {config?.autoReplyEnabled ? 'Enabled' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-surface-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({accountReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Clock className="w-3 h-3" /> Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REPLIED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'REPLIED'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> Replied ({repliedCount})
            </button>
          </div>

          {/* Star Rating Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[11px] font-semibold text-ink-muted mr-1">Stars:</span>
            {['ALL', 5, 4, 3, 2, 1].map((r) => (
              <button
                key={String(r)}
                type="button"
                onClick={() => setRatingFilter(r as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  ratingFilter === r
                    ? 'bg-ink text-white'
                    : 'bg-surface-muted text-ink-muted hover:text-ink border border-surface-border'
                }`}
              >
                {r === 'ALL' ? 'All' : `${r}★`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reviewer or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-surface-border p-12 text-center max-w-md mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-brand-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink">No reviews match your filter</h3>
          <p className="text-xs text-ink-muted mt-1">
            Try adjusting your search criteria or rating filter above.
          </p>
        </div>
      )}
    </div>
  );
};
