// src/components/settings/GbpConnectionModule.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Shield,
  AlertCircle,
  Radio,
  Clock,
  Trash2
} from 'lucide-react';

export const GbpConnectionModule: React.FC = () => {
  const { activeGbpAccount, disconnectGbpAccount, addToast } = usePartner();

  const [clientId, setClientId] = useState('891048291048-partnerai-gbp.apps.googleusercontent.com');
  const [clientSecret, setClientSecret] = useState('GOCSPX-9j1K8s91Kx918Ka_mockSecret');
  const [callbackUrl] = useState('https://app.partnerai.com/api/auth/callback/google');
  const [showSecret, setShowSecret] = useState(false);
  const [syncInterval, setSyncInterval] = useState<'realtime' | '15m' | '1h'>('realtime');
  const [isTesting, setIsTesting] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);

  const handleCopyCallback = () => {
    navigator.clipboard?.writeText(callbackUrl);
    addToast({
      type: 'info',
      title: 'Callback URL copied to clipboard',
      description: 'Paste into Google Cloud Console Authorized redirect URIs.',
    });
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      addToast({
        type: 'success',
        title: 'Google Business Profile API Verified',
        description: 'Ping latency: 42ms • Scope: Google My Business v4.9 Active.',
      });
    }, 800);
  };

  const handleReverifySync = () => {
    setIsReverifying(true);
    setTimeout(() => {
      setIsReverifying(false);
      addToast({
        type: 'success',
        title: 'Location Synced Successfully',
        description: `Refreshed reviews, photos, and insights for ${activeGbpAccount?.locationName || 'active profile'}.`,
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner / Status Overview */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center font-black text-brand-700 text-xl shrink-0">
            G
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink">Google Business Profile API</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Active Sync
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Live Google My Business OAuth 2.0 connection managing reviews, updates, and photos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          <button
            type="button"
            onClick={handleReverifySync}
            disabled={isReverifying}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-muted text-ink border border-surface-border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isReverifying ? 'animate-spin' : ''}`} />
            <span>{isReverifying ? 'Syncing...' : 'Force Sync'}</span>
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isTesting ? 'Pinging API...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Active Location Connection Details */}
        <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            Active Linked Location
          </h4>

          <div className="p-4 bg-surface-muted rounded-xl border border-surface-border text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Business Profile</span>
              <span className="font-bold text-ink">{activeGbpAccount?.locationName || 'Artisan Roast & Bakery'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Category</span>
              <span className="font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {activeGbpAccount?.category || 'Coffee Shop & Roastery'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Google Account ID</span>
              <span className="font-mono text-[11px] text-ink">{activeGbpAccount?.googleAccountId || 'accounts/10928374910283'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Verification Status</span>
              <span className="font-semibold text-emerald-800 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Last Successful Sync</span>
              <span className="text-ink-muted font-mono text-[11px]">Just now (real-time stream)</span>
            </div>
          </div>

          {/* Sync Frequency */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-ink mb-2">Auto-Sync Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'realtime', label: 'Real-time Webhook', sub: 'Instant' },
                { id: '15m', label: 'Every 15 Mins', sub: 'High frequency' },
                { id: '1h', label: 'Hourly Polling', sub: 'Standard' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSyncInterval(opt.id as any);
                    addToast({
                      type: 'success',
                      title: 'Sync frequency updated',
                      description: `Google Business Profile will poll on schedule: ${opt.label}`,
                    });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    syncInterval === opt.id
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-surface-border bg-surface hover:bg-surface-muted'
                  }`}
                >
                  <p className="text-xs font-bold text-ink">{opt.label}</p>
                  <p className="text-[10px] text-ink-muted">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-between">
            <p className="text-[11px] text-ink-muted">
              Need to unlink this location?
            </p>
            <button
              type="button"
              onClick={() => {
                if (activeGbpAccount) {
                  disconnectGbpAccount(activeGbpAccount.id);
                }
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Disconnect Account
            </button>
          </div>
        </div>

        {/* Card 2: Google Cloud Console OAuth Credentials */}
        <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              OAuth 2.0 Credentials
            </h4>
            <span className="text-[10px] font-semibold text-ink-muted bg-surface-muted px-2 py-0.5 rounded border border-surface-border">
              Production Env
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Google Cloud Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl font-mono text-ink focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-ink">Client Secret</label>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-[10px] text-brand-700 hover:text-brand-800 flex items-center gap-1 font-semibold"
                >
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSecret ? 'Hide Secret' : 'Reveal Secret'}
                </button>
              </div>
              <input
                type={showSecret ? 'text' : 'password'}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl font-mono text-ink focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-ink">Authorized Redirect URI</label>
                <button
                  type="button"
                  onClick={handleCopyCallback}
                  className="text-[10px] text-brand-700 hover:text-brand-800 flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
              </div>
              <input
                type="text"
                value={callbackUrl}
                readOnly
                className="w-full px-3 py-2 text-xs bg-surface-muted border border-surface-border rounded-xl font-mono text-ink-muted cursor-not-allowed"
              />
              <p className="text-[10px] text-ink-muted mt-1">
                Add this callback URL in Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; Authorized redirect URIs.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'OAuth Configuration Saved',
                  description: 'Client credentials validated and token store refreshed.',
                });
              }}
              className="w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Save OAuth Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
