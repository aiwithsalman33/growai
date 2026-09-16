// src/components/agency/ClientsPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpAccount } from '../../types';
import {
  Building2,
  Plus,
  Star,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const {
    userGbpAccounts,
    activeGbpAccountId,
    setActiveGbpAccountId,
    navigate,
    addGbpAccount,
    reviews,
    posts,
  } = usePartner();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // New Client Form state
  const [clientLabel, setClientLabel] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');

  const filteredClients = userGbpAccounts.filter((client) => {
    const q = searchTerm.toLowerCase();
    return (
      client.clientLabel?.toLowerCase().includes(q) ||
      client.locationName.toLowerCase().includes(q) ||
      client.category?.toLowerCase().includes(q)
    );
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    await addGbpAccount({
      ownerUserId: 'user-agency',
      clientLabel: clientLabel.trim() || locationName.trim(),
      locationName: locationName.trim(),
      googleAccountId: `accounts/2091837491023/locations/${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: address.trim() || 'San Francisco, CA',
      category: category.trim() || 'Local Business',
      phone: phone.trim() || '(415) 555-0100',
    });

    setClientLabel('');
    setLocationName('');
    setAddress('');
    setCategory('');
    setPhone('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Agency Client Profiles</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {userGbpAccounts.length} Connected
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Manage client Google Business Profiles, benchmark performance, and switch operational context.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Client Profile
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface rounded-2xl border border-surface-border p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client name, category or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <p className="text-xs text-ink-muted hidden sm:block">
          Active Client: <span className="font-bold text-brand-700">{userGbpAccounts.find(a => a.id === activeGbpAccountId)?.clientLabel}</span>
        </p>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const isActive = client.id === activeGbpAccountId;
          const clientReviews = reviews.filter((r) => r.gbpAccountId === client.id);
          const clientPosts = posts.filter((p) => p.gbpAccountId === client.id);
          const pendingCount = clientReviews.filter((r) => !r.replyText).length;

          return (
            <div
              key={client.id}
              className={`bg-surface rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                isActive
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                  : 'border-surface-border hover:border-brand-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                      {client.clientLabel?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">
                        {client.clientLabel || client.locationName}
                      </h3>
                      <p className="text-[11px] text-ink-muted">{client.category}</p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">
                      Active Scope
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-ink-muted mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-surface-muted rounded-xl text-center mb-4">
                  <div>
                    <span className="text-[10px] text-ink-muted block">Rating</span>
                    <span className="text-xs font-bold text-ink flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {client.rating?.toFixed(1) || '4.8'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block">Reviews</span>
                    <span className="text-xs font-bold text-ink">
                      {client.reviewsCount || 120}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted block">Health</span>
                    <span className="text-xs font-bold text-brand-600">
                      {client.healthScore || 90}%
                    </span>
                  </div>
                </div>

                {/* Pending Review Alert */}
                {pendingCount > 0 && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mb-4 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    {pendingCount} review{pendingCount > 1 ? 's' : ''} awaiting AI response
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveGbpAccountId(client.id);
                    navigate('/agency/dashboard');
                  }}
                  className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-brand-600 hover:bg-brand-700 text-white'
                      : 'bg-surface hover:bg-brand-50 text-ink border border-surface-border'
                  }`}
                >
                  {isActive ? 'Currently In Scope' : 'Switch to this Client'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Client Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-surface-border shadow-2xl max-w-md w-full my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-surface-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-ink">Connect Client Business Profile</h3>
                <p className="text-[11px] text-ink-muted">Google OAuth 2.0 Integration</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Client Label (Friendly Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pacific Coast Surf School"
                  value={clientLabel}
                  required
                  onChange={(e) => setClientLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Google Maps Location Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pacific Coast Surf & Paddle LLC"
                  value={locationName}
                  required
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Business Category</label>
                <input
                  type="text"
                  placeholder="e.g. Surf School, Sports Club"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 700 Great Highway, San Francisco, CA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="(415) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-ink-muted hover:text-ink text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 sm:py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors text-center"
                >
                  Authenticate & Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
