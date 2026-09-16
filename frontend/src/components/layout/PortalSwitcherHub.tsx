// src/components/layout/PortalSwitcherHub.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Building2, Users, ShieldCheck, ChevronUp, Check, KeyRound, ExternalLink } from 'lucide-react';

export const PortalSwitcherHub: React.FC = () => {
  const { currentPath, activeRole, isAuthenticated, switchUserRole, navigate, logout } = usePartner();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {expanded && (
        <div className="mb-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-surface-border shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-150 text-ink font-sans">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div>
              <div className="text-xs font-bold text-ink">Role & Portal Switcher</div>
              <div className="text-[10px] text-ink-muted">Test 3 separate panels & logins</div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isAuthenticated ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-gray-100 text-gray-600'
            }`}>
              {isAuthenticated ? `${activeRole} (Logged In)` : 'Public Guest'}
            </span>
          </div>

          {/* Quick Login Portals */}
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
              1. Direct Login Portals:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  navigate('/login/user');
                }}
                className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col items-center justify-center text-center ${
                  currentPath === '/login/user'
                    ? 'border-brand-500 bg-brand-50 text-brand-800 font-bold'
                    : 'border-surface-border bg-surface-muted hover:bg-gray-100 text-ink'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 mb-1 text-brand-600" />
                <span className="text-[10px] leading-tight">Single User Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  navigate('/login/agency');
                }}
                className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col items-center justify-center text-center ${
                  currentPath === '/login/agency'
                    ? 'border-brand-600 bg-brand-100 text-brand-800 font-bold'
                    : 'border-surface-border bg-surface-muted hover:bg-gray-100 text-ink'
                }`}
              >
                <Users className="w-3.5 h-3.5 mb-1 text-brand-700" />
                <span className="text-[10px] leading-tight">Agency Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  navigate('/login/admin');
                }}
                className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col items-center justify-center text-center ${
                  currentPath === '/login/admin'
                    ? 'border-gray-900 bg-gray-900 text-white font-bold'
                    : 'border-surface-border bg-surface-muted hover:bg-gray-100 text-ink'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 mb-1 text-gray-700" />
                <span className="text-[10px] leading-tight">Admin Login</span>
              </button>
            </div>
          </div>

          {/* Quick Authenticate & Jump directly into Panel */}
          <div className="mt-3.5 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
              2. Instant Panel Bypass (Demo Mode):
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  switchUserRole('single');
                  setExpanded(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-brand-50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-brand-600" />
                  <span>Enter Single User Panel (/user/dashboard)</span>
                </div>
                {isAuthenticated && activeRole === 'single' && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  switchUserRole('agency');
                  setExpanded(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-brand-50 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-brand-700" />
                  <span>Enter Agency Panel (/agency/dashboard)</span>
                </div>
                {isAuthenticated && activeRole === 'agency' && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  switchUserRole('super_admin');
                  setExpanded(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-800" />
                  <span>Enter Super Admin Panel (/admin/dashboard)</span>
                </div>
                {isAuthenticated && activeRole === 'super_admin' && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-surface-border flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                navigate('/');
                setExpanded(false);
              }}
              className="text-ink-muted hover:text-ink font-medium"
            >
              Public Home (/)
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setExpanded(false);
                }}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 bg-ink text-white rounded-2xl shadow-xl hover:bg-gray-800 transition-all flex items-center gap-2 text-xs font-semibold border border-white/10"
      >
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
        <span>Portals ({activeRole})</span>
        <ChevronUp className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
