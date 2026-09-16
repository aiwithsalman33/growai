// src/components/photos/PhotosPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpPhoto, PhotoCategory } from '../../types';
import {
  UploadCloud,
  X,
  Trash2,
  Eye,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

const CATEGORIES: { id: PhotoCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Photos' },
  { id: 'COVER', label: 'Cover Photos' },
  { id: 'LOGO', label: 'Logos' },
  { id: 'INTERIOR', label: 'Interior' },
  { id: 'EXTERIOR', label: 'Exterior' },
  { id: 'PRODUCT', label: 'Products' },
  { id: 'TEAM', label: 'Team' },
  { id: 'AT_WORK', label: 'At Work' },
  { id: 'IDENTITY', label: 'Identity' },
];

export const PhotosPage: React.FC = () => {
  const { photos, activeGbpAccount, uploadPhoto, deletePhoto } = usePartner();

  const [activeCategory, setActiveCategory] = useState<PhotoCategory | 'ALL'>('ALL');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GbpPhoto | null>(null);

  // Upload state
  const [newCategory, setNewCategory] = useState<PhotoCategory>('INTERIOR');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Scoped to active GBP account
  const accountPhotos = photos.filter(
    (p) => !activeGbpAccount || p.gbpAccountId === activeGbpAccount.id
  );

  const filteredPhotos = accountPhotos.filter((photo) =>
    activeCategory === 'ALL' ? true : photo.category === activeCategory
  );

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
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
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    setIsUploading(true);
    await uploadPhoto({
      gbpAccountId: activeGbpAccount?.id || 'gbp-artisan',
      url: previewUrl,
      category: newCategory,
      caption: caption.trim() || undefined,
      dimensions: '1920 x 1080',
    });

    setIsUploading(false);
    setPreviewUrl('');
    setCaption('');
    setUploadModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Photos & Media Gallery</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 shrink-0">
              {accountPhotos.length} Uploads
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Maintain high-resolution imagery across Google Maps listings to improve local search CTR.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPreviewUrl(
              'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
            );
            setUploadModalOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Upload GBP Photo
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-surface p-1.5 rounded-2xl border border-surface-border shadow-xs">
        {CATEGORIES.map((cat) => {
          const count =
            cat.id === 'ALL'
              ? accountPhotos.length
              : accountPhotos.filter((p) => p.category === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? 'bg-brand-700 text-white' : 'bg-gray-100 text-ink-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-surface rounded-2xl border border-surface-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-surface-muted overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || 'GBP Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ink/70 text-white backdrop-blur-xs">
                    {photo.category}
                  </span>
                </div>

                {/* Hover overlay with zoom and delete */}
                <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="p-2 bg-white text-ink hover:bg-brand-50 rounded-xl transition-colors shadow-sm"
                    title="Inspect photo"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo.id)}
                    className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors shadow-sm"
                    title="Delete from Google"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="text-xs text-ink font-medium truncate">
                  {photo.caption || 'Untitled Google Photo'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {photo.viewsCount?.toLocaleString()} views
                  </span>
                  <span>{photo.dimensions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-surface-border p-12 text-center max-w-md mx-auto shadow-xs">
          <ImageIcon className="w-10 h-10 text-brand-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink">No photos in this category</h3>
          <p className="text-xs text-ink-muted mt-1 mb-4">
            Businesses with photos receive 42% more requests for directions on Google Maps.
          </p>
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(
                'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'
              );
              setUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Upload Photo Now
          </button>
        </div>
      )}

      {/* Upload Dialog Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Upload Photo to Google Business</h3>
                <p className="text-[11px] text-ink-muted">
                  Syncing to: {activeGbpAccount?.locationName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {/* Drag Drop or Preview */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                  isDragging ? 'border-brand-500 bg-brand-50' : 'border-surface-border bg-surface-muted/50'
                }`}
              >
                {previewUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-surface-border max-h-48">
                    <img src={previewUrl} alt="Upload preview" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewUrl('')}
                      className="absolute top-2 right-2 p-1 bg-ink/70 hover:bg-ink text-white rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink">
                      Drag image here or{' '}
                      <label className="text-brand-600 hover:text-brand-700 underline cursor-pointer">
                        browse files
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-[10px] text-ink-muted mt-1">High-res JPG/PNG up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Category Tag */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Google Category Tag
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PhotoCategory)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Caption / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh batch of morning croissants coming out of our stone deck oven"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-ink-muted hover:text-ink text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewUrl || isUploading}
                  className="px-4 py-2 sm:py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 text-center"
                >
                  {isUploading ? 'Publishing...' : 'Publish to Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-surface rounded-2xl overflow-hidden max-w-2xl w-full border border-surface-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Photo'}
                className="w-full max-h-[60vh] object-contain bg-black"
              />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">{selectedPhoto.caption || 'Google Business Photo'}</p>
                <p className="text-xs text-ink-muted">
                  Category: {selectedPhoto.category} • {selectedPhoto.dimensions} •{' '}
                  {selectedPhoto.viewsCount?.toLocaleString()} Total Impressions
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  deletePhoto(selectedPhoto.id);
                  setSelectedPhoto(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
