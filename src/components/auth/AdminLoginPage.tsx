// src/components/auth/AdminLoginPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { ShieldAlert, ShieldCheck, ArrowRight, KeyRound, AlertCircle, Lock, Terminal, Sparkles } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, navigate } = usePartner();
  const [email, setEmail] = useState('alex@partner.ai');
  const [password, setPassword] = useState('password123');
  const [twoFactorCode, setTwoFactorCode] = useState('849201');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await login('super_admin', email, password);
    setLoading(false);

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleFillDemo = () => {
    setEmail('alex@partner.ai');
    setPassword('password123');
    setTwoFactorCode('849201');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 mb-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight font-sans">
            Partner<span className="text-brand-400">.ai</span>
          </span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-xs font-mono font-bold mb-2">
          <Lock className="w-3.5 h-3.5 text-brand-400" />
          <span>Panel 3: Super Admin Gateway</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Internal Operations Center
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Platform-wide controls, tenant telemetry, and global settings
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-gray-900/90 backdrop-blur-md py-8 px-6 shadow-2xl border border-gray-800 rounded-2xl sm:px-10">
          {/* Quick Demo Autofill chip */}
          <div className="mb-6 p-3 bg-gray-800/80 rounded-xl border border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-gray-200">Admin Demo Credential:</div>
              <div className="text-[10px] text-gray-400 font-mono">alex@partner.ai (Super Admin)</div>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600 shadow-xs"
            >
              Autofill
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
              {errorMessage.includes('Single') && (
                <button
                  type="button"
                  onClick={() => navigate('/login/user')}
                  className="self-start text-[11px] font-bold text-brand-400 hover:underline flex items-center gap-1 mt-1"
                >
                  <span>Go to Single Business Login</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {errorMessage.includes('Agency') && (
                <button
                  type="button"
                  onClick={() => navigate('/login/agency')}
                  className="self-start text-[11px] font-bold text-brand-400 hover:underline flex items-center gap-1 mt-1"
                >
                  <span>Go to Agency Login Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@partner.ai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-300">
                  Hardware 2FA / TOTP Code
                </label>
                <span className="text-[10px] text-gray-500 font-mono">Mock 6-digit</span>
              </div>
              <input
                type="text"
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="849201"
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-brand-400 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying Credentials...' : 'Authenticate Super Admin'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col gap-2 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1.5 text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-gray-400" />
              <span>Internal system access is strictly logged & audited.</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors text-[11px] mt-2"
            >
              ← Return to public website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
