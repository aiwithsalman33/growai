// src/components/reviews/ReviewCard.tsx
import React, { useState } from 'react';
import { GbpReview } from '../../types';
import { usePartner } from '../../lib/store';
import {
  Star,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bot,
  User,
  Sliders,
  Clock,
  RotateCcw
} from 'lucide-react';

interface ReviewCardProps {
  review: GbpReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { replyToReview, generateAiReply, aiConfigs, activeGbpAccount } = usePartner();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.replyText || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string>('default');

  const config = aiConfigs[review.gbpAccountId] || aiConfigs['gbp-artisan'];
  const hasReply = !!review.replyText;

  const handleGenerate = async (tone?: string) => {
    setIsGenerating(true);
    setIsReplying(true);
    try {
      const draft = await generateAiReply(review, tone || selectedTone);
      setReplyText(draft);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await replyToReview(review.id, replyText.trim(), isReplying ? 'ai' : 'manual');
    setIsReplying(false);
  };

  return (
    <div
      className={`bg-surface rounded-2xl border transition-all p-5 shadow-xs ${
        hasReply
          ? 'border-surface-border'
          : 'border-brand-300/80 bg-gradient-to-br from-surface to-brand-50/20'
      }`}
    >
      {/* Reviewer Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {review.reviewerPhotoUrl ? (
            <img
              src={review.reviewerPhotoUrl}
              alt={review.reviewerName}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-surface-border shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
              {review.reviewerName.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate">{review.reviewerName}</p>
            <p className="text-[11px] text-ink-muted truncate">
              Google Maps Review •{' '}
              {new Date(review.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 self-start sm:self-auto">
          {hasReply ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2.5 py-1 rounded-full border border-brand-200">
              <CheckCircle2 className="w-3 h-3 text-brand-600" />
              Replied {review.replySource === 'ai' ? '(AI Assisted)' : '(Manual)'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Pending Reply
            </span>
          )}
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-2 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
            }`}
          />
        ))}
        <span className="text-xs font-bold text-ink ml-1.5">{review.rating}.0</span>
      </div>

      {/* Review Body */}
      <p className="text-xs text-ink leading-relaxed mb-4 bg-surface-muted/40 p-3 rounded-xl border border-surface-border">
        "{review.text}"
      </p>

      {/* Existing Reply (if already sent) */}
      {hasReply && !isReplying && (
        <div className="bg-brand-50/50 border border-brand-200 rounded-xl p-3.5 space-y-2 mb-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-brand-900 flex items-center gap-1.5">
              {review.replySource === 'ai' ? (
                <Bot className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <User className="w-3.5 h-3.5 text-brand-600" />
              )}
              Response from Owner ({activeGbpAccount?.locationName})
            </span>
            <span className="text-ink-muted">
              {review.repliedAt
                ? new Date(review.repliedAt).toLocaleDateString()
                : 'Recently posted'}
            </span>
          </div>
          <p className="text-xs text-ink leading-relaxed">{review.replyText}</p>

          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 underline"
          >
            Edit live response
          </button>
        </div>
      )}

      {/* Reply Action Box or Trigger */}
      {!hasReply && !isReplying && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Analyzing with Persona...' : 'Generate AI Reply'}
          </button>

          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="px-3 py-1.5 bg-surface hover:bg-surface-muted text-ink border border-surface-border rounded-xl text-xs font-semibold transition-colors"
          >
            Write Manual Reply
          </button>

          {config?.autoReplyEnabled && (
            <span className="text-[10px] text-ink-muted ml-auto">
              Auto-reply rule: {review.rating >= config.autoReplyMinRating ? 'Eligible' : 'Requires manual sign-off'}
            </span>
          )}
        </div>
      )}

      {/* Active Reply Editor (AI Draft or Manual with Persona controls) */}
      {isReplying && (
        <div className="mt-3 p-4 bg-surface rounded-xl border border-brand-300 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="text-xs font-bold text-ink">Review Response Studio</span>
            </div>

            {/* Quick Tone Adjusters */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-ink-muted text-[10px] mr-1">Tone:</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('concise');
                  handleGenerate('concise');
                }}
                className="px-2 py-0.5 rounded-md bg-surface-muted hover:bg-brand-50 text-ink-muted hover:text-brand-800 border border-surface-border font-medium"
              >
                Concise
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('luxury');
                  handleGenerate('luxury');
                }}
                className="px-2 py-0.5 rounded-md bg-surface-muted hover:bg-brand-50 text-ink-muted hover:text-brand-800 border border-surface-border font-medium"
              >
                Luxury
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTone('default');
                  handleGenerate('default');
                }}
                className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 border border-brand-200 font-semibold flex items-center gap-1"
                title="Regenerate using active persona script"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Re-Draft
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response or click Generate AI Reply above..."
              className="w-full p-3 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-[10px] text-ink-muted">
              Always review before sending to ensure compliance with Google Business guidelines.
            </p>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText(review.replyText || '');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!replyText.trim()}
                onClick={handleSendReply}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Post Reply to Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
