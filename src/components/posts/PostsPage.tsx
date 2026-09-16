// src/components/posts/PostsPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpPost, PostStatus, PostType } from '../../types';
import { PostCard } from './PostCard';
import { PostFormModal } from './PostFormModal';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const PostsPage: React.FC = () => {
  const { posts, activeGbpAccount, deletePost, duplicatePost, currentPath } = usePartner();

  const [modalOpen, setModalOpen] = useState(currentPath.endsWith('/new'));
  const [editingPost, setEditingPost] = useState<GbpPost | null>(null);

  React.useEffect(() => {
    if (currentPath.endsWith('/new')) {
      setModalOpen(true);
      setEditingPost(null);
    }
  }, [currentPath]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PostStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PostType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  // Filter posts by active GBP account
  const accountPosts = posts.filter(
    (p) => !activeGbpAccount || p.gbpAccountId === activeGbpAccount.id
  );

  const filteredPosts = accountPosts.filter((post) => {
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || post.type === typeFilter;
    const matchesSearch =
      post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.eventTitle && post.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.ctaLabel && post.ctaLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedPostIds.length} selected posts?`)) {
      for (const id of selectedPostIds) {
        await deletePost(id);
      }
      setSelectedPostIds([]);
    }
  };

  const handleBulkDuplicate = async () => {
    for (const id of selectedPostIds) {
      await duplicatePost(id);
    }
    setSelectedPostIds([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Google Business Posts</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 shrink-0">
              {accountPosts.length} Total
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Publish offers, events, products, and announcements directly to Google Maps & Search.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPost(null);
            setModalOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create GBP Post
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-surface-border text-xs overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Posts' },
              { id: 'PUBLISHED', label: 'Published' },
              { id: 'SCHEDULED', label: 'Scheduled' },
              { id: 'DRAFT', label: 'Drafts' },
              { id: 'FAILED', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input & Post Type Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search caption or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
            >
              <option value="ALL">All Types</option>
              <option value="STANDARD">What's New</option>
              <option value="EVENT">Events</option>
              <option value="OFFER">Offers</option>
              <option value="PRODUCT">Products</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when posts selected) */}
        {selectedPostIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900">
            <span className="font-semibold">{selectedPostIds.length} posts selected</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDuplicate}
                className="px-3 py-1 bg-surface hover:bg-surface-muted text-ink border border-surface-border rounded-lg font-medium flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={(p) => {
                setEditingPost(p);
                setModalOpen(true);
              }}
              onReschedule={(p) => {
                setEditingPost(p);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface rounded-2xl border border-surface-border p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink">No posts match your filters</h3>
          <p className="text-xs text-ink-muted mt-1 mb-6 leading-relaxed">
            Google Business Profile posts expire after 6 months. Create weekly updates or schedule offers to keep your ranking high.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingPost(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Your First Post
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <PostFormModal
          postToEdit={editingPost}
          onClose={() => {
            setModalOpen(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
};
