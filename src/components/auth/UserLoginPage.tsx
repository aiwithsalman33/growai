// src/components/auth/UserLoginPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Building2, Sparkles, ArrowRight, KeyRound, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export const UserLoginPage: React.FC = () => {
  const { login, navigate } = usePartner();
  const [email, setEmail] = useState('elena@artisanroast.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await login('single', email, password);
    setLoading(false);

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
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
          <span>Panel 1: Single Business Login</span>
        </div>

        <h2 className="text-2xl font-extrabold text-ink tracking-tight">
          Sign in to your business
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Manage your single Google Business Profile, review replies, and post schedules
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-surface-border rounded-2xl sm:px-10">
          {/* Quick Demo Autofill chip */}
          <div className="mb-6 p-3 bg-brand-50/60 rounded-xl border border-brand-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-brand-800">Quick Demo Account:</div>
              <div className="text-[10px] text-ink-muted">Elena Rostova (Artisan Roast)</div>
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo('elena@artisanroast.com')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors shadow-xs"
            >
              Use Credential
            </button>
          </div>

          {/* Error Banner with cross-role hints */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              {errorMessage.includes('Agency') && (
                <button
                  type="button"
                  onClick={() => navigate('/login/agency')}
                  className="self-start text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1 mt-1"
                >
                  <span>Go to Agency Login Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {errorMessage.includes('Super Admin') && (
                <button
                  type="button"
                  onClick={() => navigate('/login/admin')}
                  className="self-start text-[11px] font-bold text-gray-800 hover:underline flex items-center gap-1 mt-1"
                >
                  <span>Go to Super Admin Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-ink">
                  Password
                </label>
                <span className="text-[11px] text-ink-muted hover:text-brand-600 cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-ink"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm hover:shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign in to Business Panel'}</span>
            </button>
          </form>

          {/* Cross login links */}
          <div className="mt-6 pt-6 border-t border-surface-border flex flex-col gap-2.5 text-center text-xs">
            <div className="text-ink-muted">
              Don&apos;t have a single business account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup/user')}
                className="font-bold text-brand-600 hover:underline"
              >
                Sign up free
              </button>
            </div>

            <div className="text-[11px] text-ink-muted flex items-center justify-center gap-1 mt-1">
              <span>Are you an agency?</span>
              <button
                type="button"
                onClick={() => navigate('/login/agency')}
                className="font-bold text-brand-700 hover:underline"
              >
                Agency Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
