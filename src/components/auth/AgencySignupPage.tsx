// src/components/auth/AgencySignupPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Users, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const AgencySignupPage: React.FC = () => {
  const { signup, navigate } = usePartner();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signup('agency', name, email, agencyName);
    setLoading(false);

    if (res && !res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 mb-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-ink tracking-tight font-sans">
            Partner<span className="text-brand-600">.ai</span>
          </span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-800 text-xs font-bold mb-2">
          <Users className="w-3.5 h-3.5 text-brand-700" />
          <span>Agency Partner Registration</span>
        </div>

        <h2 className="text-2xl font-extrabold text-ink tracking-tight">
          Create agency workspace
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Manage multiple client Google Business Profiles under one centralized login
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-surface-border rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Agency Lead / Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Agency Name
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. PeakScale Growth Agency"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@peakscalemedia.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-100 text-[11px] text-ink-muted">
              <div className="font-semibold text-brand-900 mb-1">Plan: Agency Starter ($129/mo, 14-day free trial)</div>
              <div>• Manage up to 5 client GBP locations</div>
              <div>• Client switcher, multi-location comparison, team seats</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm hover:shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Agency...' : 'Continue to First Client Connect'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-border text-center text-xs text-ink-muted">
            Already have an agency account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login/agency')}
              className="font-bold text-brand-700 hover:underline"
            >
              Sign in to agency panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
