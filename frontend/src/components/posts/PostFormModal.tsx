// src/components/posts/PostFormModal.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpPost, PostType, PostStatus } from '../../types';
import {
  X,
  UploadCloud,
  Calendar,
  Clock,
  Sparkles,
  Link,
  Tag,
  AlertCircle,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

interface PostFormModalProps {
  postToEdit?: GbpPost | null;
  onClose: () => void;
}

const CTA_OPTIONS = [
  'None',
  'Book',
  'Order Online',
  'Buy',
  'Learn More',
  'Sign Up',
  'Call Now'
];

export const PostFormModal: React.FC<PostFormModalProps> = ({ postToEdit, onClose }) => {
  const { createPost, updatePost, activeGbpAccount } = usePartner();

  const [type, setType] = useState<PostType>(postToEdit?.type || 'STANDARD');
  const [caption, setCaption] = useState(postToEdit?.caption || '');
  const [imageUrl, setImageUrl] = useState(
    postToEdit?.imageUrl ||
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
  );
  const [ctaLabel, setCtaLabel] = useState(postToEdit?.ctaLabel || 'Learn More');
  const [ctaLink, setCtaLink] = useState(postToEdit?.ctaLink || 'https://');
  const [eventTitle, setEventTitle] = useState(postToEdit?.eventTitle || '');
  const [eventStart, setEventStart] = useState(
    postToEdit?.eventStart || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16)
  );
  const [eventEnd, setEventEnd] = useState(
    postToEdit?.eventEnd || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
  );
  const [couponCode, setCouponCode] = useState(postToEdit?.couponCode || '');
  const [terms, setTerms] = useState(postToEdit?.terms || '');

  // Schedule toggle
  const [isScheduled, setIsScheduled] = useState(postToEdit?.status === 'SCHEDULED');
  const [scheduledAt, setScheduledAt] = useState(
    postToEdit?.scheduledAt || new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Character limit tracking (Google limit ~1500 chars)
  const CHAR_LIMIT = 1500;
  const remainingChars = CHAR_LIMIT - caption.length;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    setIsSubmitting(true);

    const status: PostStatus = isScheduled ? 'SCHEDULED' : 'PUBLISHED';

    const payload: Omit<GbpPost, 'id'> = {
      gbpAccountId: activeGbpAccount?.id || 'gbp-artisan',
      type,
      caption: caption.trim(),
      imageUrl,
      ctaLabel: ctaLabel === 'None' ? undefined : ctaLabel,
      ctaLink: ctaLabel === 'None' ? undefined : ctaLink,
      eventTitle: type === 'EVENT' ? eventTitle : undefined,
      eventStart: type === 'EVENT' || type === 'OFFER' ? eventStart : undefined,
      eventEnd: type === 'EVENT' || type === 'OFFER' ? eventEnd : undefined,
      couponCode: type === 'OFFER' ? couponCode : undefined,
      terms: type === 'OFFER' ? terms : undefined,
      status,
      scheduledAt: isScheduled ? scheduledAt : undefined,
    };

    if (postToEdit) {
      await updatePost(postToEdit.id, payload);
    } else {
      await createPost(payload);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-surface-border shadow-2xl max-w-2xl w-full my-auto sm:my-8 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-surface-border flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-ink truncate">
              {postToEdit ? 'Edit GBP Post' : 'Create New Google Business Post'}
            </h2>
            <p className="text-[11px] sm:text-xs text-ink-muted truncate">
              Publishing to: <span className="font-semibold text-brand-700">{activeGbpAccount?.locationName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-surface-muted shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          {/* Post Type Selector (Mirrors GBP Official Post Types) */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Post Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'STANDARD', label: "What's New", desc: 'Announcements & updates' },
                { id: 'EVENT', label: 'Event', desc: 'Date, time & RSVP' },
                { id: 'OFFER', label: 'Special Offer', desc: 'Coupons & discounts' },
                { id: 'PRODUCT', label: 'Product', desc: 'Item highlight' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as PostType)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === item.id
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-xs ring-1 ring-brand-500'
                      : 'border-surface-border hover:border-gray-300 text-ink bg-surface'
                  }`}
                >
                  <p className="text-xs font-bold">{item.label}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload Area with Drag-and-Drop + Preview */}
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
              Post Media & Photo
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-border hover:border-brand-300 bg-surface-muted/50'
              }`}
            >
              {imageUrl ? (
                <div className="space-y-3">
                  <div className="relative max-h-48 rounded-lg overflow-hidden border border-surface-border mx-auto max-w-sm">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-ink/70 hover:bg-ink text-white rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Photo ready. Google recommends 4:3 or 1:1 aspect ratio, minimum 720x540px.
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-ink">
                    Drag and drop an image, or{' '}
                    <label className="text-brand-600 hover:text-brand-700 underline cursor-pointer">
                      browse local file
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-[10px] text-ink-muted mt-1">PNG, JPG or WebP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Event Title */}
          {type === 'EVENT' && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Saturday Live Jazz & Cupping Session"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          )}

          {/* Conditional Event / Offer Dates */}
          {(type === 'EVENT' || type === 'OFFER') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Conditional Offer Coupon & Terms */}
          {type === 'OFFER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Coupon Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Terms & Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valid in-store only. 1 per customer."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Caption Textarea with character counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                Post Description & Caption <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium ${
                  remainingChars < 100 ? 'text-red-600 font-bold' : 'text-ink-muted'
                }`}
              >
                {caption.length} / {CHAR_LIMIT} chars
              </span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={CHAR_LIMIT}
              placeholder="Tell your customers what's happening at your location. Mention fresh specials, hours, or announcements..."
              required
              className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Call To Action (CTA) Button config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Call-to-Action (CTA) Button
              </label>
              <select
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                {CTA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {ctaLabel !== 'None' && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Destination URL
                </label>
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="https://yourbusiness.com/offer"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scheduling Options */}
          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink">Schedule for Later</p>
                <p className="text-[11px] text-ink-muted">
                  Automatically publish this post on a future date and time
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {isScheduled && (
              <div className="pt-2 border-t border-surface-border flex items-center gap-3">
                <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-surface-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-muted rounded-xl transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !caption.trim()}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Processing...'
              ) : isScheduled ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Schedule Post</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Publish Now to Google</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
