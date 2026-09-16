// src/components/auth/UserSignupPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Building2, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const UserSignupPage: React.FC = () => {
  const { signup, navigate } = usePartner();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signup('single', name, email, businessName, password);
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
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-ink tracking-tight font-sans">
            Partner<span className="text-brand-500">.ai</span>
          </span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-2">
          <Building2 className="w-3.5 h-3.5 text-brand-600" />
          <span>Single Business Registration</span>
        </div>

        <h2 className="text-2xl font-extrabold text-ink tracking-tight">
          Create your business account
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Connect your Google Business Profile and unlock AI-powered local growth
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
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Artisan Roast & Espresso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@artisanroast.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
              />
            </div>

            <div className="p-3 bg-surface-muted rounded-xl border border-surface-border text-[11px] text-ink-muted">
              <div className="font-semibold text-ink mb-1">Plan: Single Business ($59/mo, 14-day free trial)</div>
              <div>• 1 Google Business Profile connection (locked)</div>
              <div>• Unlimited scheduled posts & AI review replies</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm hover:shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Continue to GBP Onboarding'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-border text-center text-xs text-ink-muted">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login/user')}
              className="font-bold text-brand-600 hover:underline"
            >
              Sign in to single business panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
