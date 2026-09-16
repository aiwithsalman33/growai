// src/components/agency/AgencyOnboardingPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Users, Sparkles, Building2, CheckCircle2, ArrowRight, ShieldCheck, Plus } from 'lucide-react';

export const AgencyOnboardingPage: React.FC = () => {
  const { navigate, addToast } = usePartner();
  const [connecting, setConnecting] = useState(false);
  const [clientName, setClientName] = useState('Blue Harbor Seafood Grill');
  const [connected, setConnected] = useState(false);

  const handleConnectFirstClient = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      addToast({
        type: 'success',
        title: 'First client account linked!',
        description: `Successfully onboarded "${clientName}". You can add more client accounts anytime.`
      });
      setTimeout(() => {
        navigate('/agency/dashboard');
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-800 text-xs font-bold mb-2">
            <span>Agency Onboarding • Step 1 of 2</span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">
            Connect your first client profile
          </h1>
          <p className="text-xs text-ink-muted mt-2">
            Link your agency Google account or enter client authorization to begin managing reviews, metrics, and posts.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-surface-border shadow-sm">
          <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-start gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-xs text-brand-900">
              <div className="font-bold">Agency Delegation & OAuth Access</div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                Agency workspaces support multiple independent client profiles under a single master login.
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Client Brand / Internal Label
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Blue Harbor Seafood Grill"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-ink"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface-muted">
              <div className="w-8 h-8 rounded-lg bg-white border border-surface-border flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ink">{clientName || 'First Client Account'}</div>
                <div className="text-[11px] text-ink-muted">Google Business Profile Location ID: 8492041289</div>
              </div>
              <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                Ready to link
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={connecting || connected}
            onClick={handleConnectFirstClient}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {connecting ? (
              <span>Authenticating with Google OAuth...</span>
            ) : connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Linked! Opening Agency Dashboard...</span>
              </>
            ) : (
              <>
                <span>Connect First Client Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/agency/dashboard')}
              className="text-xs text-ink-muted hover:text-ink font-medium"
            >
              Skip to Agency Dashboard demo data →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
