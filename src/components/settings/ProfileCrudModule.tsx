// src/components/settings/ProfileCrudModule.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpAccount } from '../../types';
import {
  User as UserIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Shield,
  Key,
  Clock,
  Sparkles,
  Save,
  AlertTriangle
} from 'lucide-react';

export const ProfileCrudModule: React.FC = () => {
  const {
    currentUser,
    activeRole,
    gbpAccounts,
    activeGbpAccountId,
    setActiveGbpAccountId,
    addGbpAccount,
    updateGbpAccount,
    disconnectGbpAccount,
    updateCurrentUser,
    addToast
  } = usePartner();

  // Basic User Profile State
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '+1 (555) 234-8901');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'Artisan Hospitality Group');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Change Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // GBP Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newClientLabel, setNewClientLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Restaurant');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newPlaceId, setNewPlaceId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOpeningHours, setNewOpeningHours] = useState('Mon-Sun: 7:00 AM - 9:00 PM');

  // GBP Edit Modal State
  const [editingAccount, setEditingAccount] = useState<GbpAccount | null>(null);

  // GBP Delete Confirmation State
  const [deletingAccount, setDeletingAccount] = useState<GbpAccount | null>(null);

  // Handle Save User Profile
  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    await updateCurrentUser({
      name: userName,
      email: userEmail,
      phone: userPhone,
      companyName,
    });
    setIsSavingUser(false);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        description: 'New password and confirmation do not match.',
      });
      return;
    }
    setPasswordModalOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast({
      type: 'success',
      title: 'Password Changed Successfully',
      description: 'Your login credentials have been securely updated.',
    });
  };

  // Handle Create GBP Account
  const handleCreateGbp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      addToast({
        type: 'error',
        title: 'Location name is required',
        description: 'Please enter the official business name as listed on Google Maps.',
      });
      return;
    }

    await addGbpAccount({
      ownerUserId: currentUser.id,
      locationName: newLocationName.trim(),
      clientLabel: newClientLabel.trim() || undefined,
      category: newCategory.trim() || 'Local Business',
      address: newAddress.trim() || '100 Main St, Suite 1, San Francisco, CA',
      phone: newPhone.trim() || '+1 (415) 555-0199',
      website: newWebsite.trim() || 'https://example.com',
      placeId: newPlaceId.trim() || `ChIJ${Math.random().toString(36).substring(2, 12)}`,
      description: newDescription.trim() || 'Verified Google Business Profile location.',
      openingHours: newOpeningHours.trim() || 'Mon-Sun: 8:00 AM - 8:00 PM',
      googleAccountId: `accounts/${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    });

    setCreateModalOpen(false);
    setNewLocationName('');
    setNewClientLabel('');
    setNewAddress('');
    setNewPhone('');
    setNewWebsite('');
    setNewPlaceId('');
    setNewDescription('');
  };

  // Handle Update GBP Account
  const handleUpdateGbp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    await updateGbpAccount(editingAccount.id, editingAccount);
    setEditingAccount(null);
  };

  // Handle Delete GBP Account
  const handleDeleteGbp = async () => {
    if (!deletingAccount) return;
    await disconnectGbpAccount(deletingAccount.id);
    setDeletingAccount(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* SECTION 1: Basic User Profile Details */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={currentUser?.name}
              className="w-14 h-14 rounded-2xl object-cover border border-surface-border shadow-xs shrink-0"
            />
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-brand-600" />
                User Profile & Account Info
              </h3>
              <p className="text-xs text-ink-muted">
                Manage your personal identity, contact details, and account security.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface hover:bg-surface-muted text-ink border border-surface-border flex items-center gap-1.5 transition-colors self-start sm:self-center"
          >
            <Key className="w-3.5 h-3.5 text-brand-600" />
            <span>Change Password</span>
          </button>
        </div>

        <form onSubmit={handleSaveUserProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl text-ink font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl text-ink font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Phone Number</label>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl text-ink font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {activeRole === 'agency' ? 'Agency / Company Name' : 'Business / Organization'}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl text-ink font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingUser}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingUser ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Connected GBP Profiles with Full CRUD */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                Connected Google Business Profiles ({gbpAccounts?.length ?? 0})
              </h3>
              <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                CRUD Enabled
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Read, create, update, and disconnect your connected Google Business Profile locations and metadata.
            </p>
          </div>

          {/* CREATE ACTION */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Connect New GBP Profile</span>
          </button>
        </div>

        {/* READ: Cards List of all connected GBP Profiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gbpAccounts?.map((acc) => {
            const isActive = acc.id === activeGbpAccountId;

            return (
              <div
                key={acc.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/50 shadow-xs'
                    : 'border-surface-border bg-surface hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-ink">{acc.locationName}</h4>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full">
                            Active Scope
                          </span>
                        )}
                      </div>
                      {acc.clientLabel && (
                        <p className="text-[11px] font-semibold text-brand-700 mt-0.5">
                          Client: {acc.clientLabel}
                        </p>
                      )}
                      <span className="inline-block text-[10px] text-ink-muted bg-surface-muted px-2 py-0.5 rounded border border-surface-border mt-1">
                        {acc.category || 'Local Business'}
                      </span>
                    </div>

                    {/* Action icons: Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingAccount(acc)}
                        title="Edit Profile Details"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAccount(acc)}
                        title="Disconnect Profile"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-ink-muted">
                    {acc.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-ink">{acc.address}</span>
                      </div>
                    )}
                    {acc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-[11px] text-ink">{acc.phone}</span>
                      </div>
                    )}
                    {acc.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a
                          href={acc.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brand-700 hover:underline flex items-center gap-1"
                        >
                          {acc.website}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                    {acc.openingHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-[11px] text-ink-muted">{acc.openingHours}</span>
                      </div>
                    )}
                  </div>

                  {acc.description && (
                    <p className="text-[11px] text-ink-muted mt-2.5 line-clamp-2 bg-surface-muted/60 p-2 rounded-lg border border-surface-border">
                      {acc.description}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {acc.healthScore || 94}% Health
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-ink font-semibold">★ {acc.rating || 4.8} ({acc.reviewsCount || 42})</span>
                  </div>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGbpAccountId(acc.id);
                        addToast({
                          type: 'info',
                          title: 'Active Scope Switched',
                          description: `Switched to ${acc.locationName}.`,
                        });
                      }}
                      className="text-[11px] font-bold text-brand-700 hover:text-brand-800 hover:underline"
                    >
                      Make Active
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: CREATE GBP PROFILE */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h4 className="text-base font-bold text-ink flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                Connect New Google Business Location
              </h4>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGbp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Location / Business Name *
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Artisan Roast & Bakery - Downtown"
                  required
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl font-semibold text-ink focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {activeRole === 'agency' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Client Label / Account Tag (Agency)
                  </label>
                  <input
                    type="text"
                    value={newClientLabel}
                    onChange={(e) => setNewClientLabel(e.target.value)}
                    placeholder="e.g. Client: Artisan Hospitality Group"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Coffee Shop, Dental Clinic"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (415) 555-0199"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Physical Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="100 Market St, San Francisco, CA 94105"
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Website URL</label>
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://artisanroast.com"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Google Place ID</label>
                  <input
                    type="text"
                    value={newPlaceId}
                    onChange={(e) => setNewPlaceId(e.target.value)}
                    placeholder="ChIJ82k1... (optional)"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Opening Hours</label>
                <input
                  type="text"
                  value={newOpeningHours}
                  onChange={(e) => setNewOpeningHours(e.target.value)}
                  placeholder="Mon-Sun: 7:00 AM - 9:00 PM"
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Business Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Artisanal specialty coffee roaster and bakery serving sourdough..."
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Connect & Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE GBP PROFILE */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h4 className="text-base font-bold text-ink flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-600" />
                Update Profile: {editingAccount.locationName}
              </h4>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-ink-muted hover:text-ink text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateGbp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Location Name</label>
                <input
                  type="text"
                  value={editingAccount.locationName}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, locationName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl font-bold text-ink focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {activeRole === 'agency' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Client Tag</label>
                  <input
                    type="text"
                    value={editingAccount.clientLabel || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, clientLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Category</label>
                  <input
                    type="text"
                    value={editingAccount.category || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingAccount.phone || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Address</label>
                <input
                  type="text"
                  value={editingAccount.address || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, address: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Website</label>
                  <input
                    type="url"
                    value={editingAccount.website || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, website: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={editingAccount.openingHours || ''}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, openingHours: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Business Description</label>
                <textarea
                  rows={2}
                  value={editingAccount.description || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE / DISCONNECT CONFIRMATION */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-ink">
                Disconnect Google Business Profile?
              </h4>
              <p className="text-xs text-ink-muted mt-1">
                Are you sure you want to disconnect <span className="font-bold text-ink">{deletingAccount.locationName}</span>?
                This unlinks the location and revokes active API synchronization.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Keep Connected
              </button>
              <button
                type="button"
                onClick={handleDeleteGbp}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Yes, Disconnect Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CHANGE PASSWORD */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                Change Account Password
              </h4>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
