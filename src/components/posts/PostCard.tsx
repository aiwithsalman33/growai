// src/components/posts/PostCard.tsx
import React, { useState } from 'react';
import { GbpPost } from '../../types';
import { usePartner } from '../../lib/store';
import {
  Calendar,
  Clock,
  Eye,
  MousePointerClick,
  MoreVertical,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PostCardProps {
  post: GbpPost;
  onEdit: (post: GbpPost) => void;
  onReschedule: (post: GbpPost) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onReschedule }) => {
  const { deletePost, duplicatePost } = usePartner();
  const [menuOpen, setMenuOpen] = useState(false);

  const getStatusBadge = (status: GbpPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100/90 px-2 py-0.5 rounded-full border border-brand-200">
            <CheckCircle2 className="w-3 h-3 text-brand-600" /> Published
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Scheduled
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            Draft
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" /> Sync Failed
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Post Image Container */}
        <div className="relative h-44 bg-surface-muted overflow-hidden">
          <img
            src={post.imageUrl}
            alt="GBP Post"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ink/80 text-white backdrop-blur-xs">
              {post.type}
            </span>
          </div>

          <div className="absolute top-3 right-3">{getStatusBadge(post.status)}</div>
        </div>

        {/* Post Content */}
        <div className="p-4 space-y-3">
          {post.eventTitle && (
            <p className="text-xs font-bold text-brand-800 bg-brand-50 px-2 py-1 rounded-md">
              📅 {post.eventTitle}
            </p>
          )}

          <p className="text-xs text-ink leading-relaxed line-clamp-3">
            {post.caption}
          </p>

          {post.couponCode && (
            <div className="inline-block text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
              Code: {post.couponCode}
            </div>
          )}

          {/* CTA Link preview */}
          {post.ctaLabel && (
            <div className="flex items-center gap-1 text-xs font-semibold text-brand-700">
              <span>CTA: {post.ctaLabel}</span>
              {post.ctaLink && <ExternalLink className="w-3 h-3 text-brand-600" />}
            </div>
          )}
        </div>
      </div>

      {/* Footer info & actions */}
      <div className="p-4 pt-3 border-t border-surface-border bg-surface-muted/30 flex items-center justify-between text-[11px] text-ink-muted">
        <div>
          {post.status === 'PUBLISHED' && post.publishedAt && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-ink-muted" />
                {post.viewsCount?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-ink-muted" />
                {post.clicksCount?.toLocaleString() || 0}
              </span>
            </div>
          )}
          {post.status === 'SCHEDULED' && post.scheduledAt && (
            <span className="flex items-center gap-1 text-blue-700 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.scheduledAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {post.status === 'DRAFT' && <span>Unpublished draft</span>}
        </div>

        {/* Action Menu */}
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="p-1.5 hover:bg-surface text-ink-muted hover:text-ink rounded-lg transition-colors"
            title="Edit post"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => duplicatePost(post.id)}
            className="p-1.5 hover:bg-surface text-ink-muted hover:text-ink rounded-lg transition-colors"
            title="Duplicate as draft"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deletePost(post.id)}
            className="p-1.5 hover:bg-red-50 text-ink-muted hover:text-red-600 rounded-lg transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
