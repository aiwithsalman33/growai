// src/components/user/UserOnboardingPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Building2, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

export const UserOnboardingPage: React.FC = () => {
  const { navigate, addToast, activeGbpAccount } = usePartner();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleSimulateGoogleOauth = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      addToast({
        type: 'success',
        title: 'Google Business Profile connected!',
        description: 'Successfully authorized "Artisan Roast & Espresso". Single account limit applied.'
      });
      setTimeout(() => {
        navigate('/user/dashboard');
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-2">
            <span>Step 1 of 1: Connect Business Profile</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">
            Connect your Google Business Profile
          </h1>
          <p className="text-xs text-ink-muted mt-2">
            Your plan allows connecting exactly 1 Google location. Authorize Partner.ai to sync reviews, metrics, and scheduled posts.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-surface-border shadow-sm">
          <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-start gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-900">
              <div className="font-bold">Official Google Business Profile API OAuth</div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                We request read/write permissions for posts, reviews, and insights strictly for your designated business location.
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-muted">
              <div className="w-8 h-8 rounded-lg bg-white border border-surface-border flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ink">Artisan Roast & Espresso</div>
                <div className="text-[11px] text-ink-muted">742 Evergreen Terrace, Springfield • Coffee Shop</div>
              </div>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                Ready to sync
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={connecting || connected}
            onClick={handleSimulateGoogleOauth}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {connecting ? (
              <span>Authenticating with Google OAuth 2.0...</span>
            ) : connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Connected! Redirecting to Dashboard...</span>
              </>
            ) : (
              <>
                <span>Authorize & Connect Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="text-xs text-ink-muted hover:text-ink font-medium"
            >
              Skip for now and enter demo mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
