// src/components/layout/Topbar.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { UserRole } from '../../types';
import {
  Sparkles,
  ChevronDown,
  Building2,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Plus,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  Home
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    currentUser,
    activeRole,
    switchUserRole,
    activeGbpAccountId,
    setActiveGbpAccountId,
    activeGbpAccount,
    userGbpAccounts,
    currentPath,
    navigate,
    resetToDefaults,
  } = usePartner();

  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-surface-border h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left side: Context badge or Client Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        {activeRole === 'agency' ? (
          /* Agency Client Switcher Dropdown */
          <div className="relative">
            <button
              type="button"
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-muted hover:bg-brand-50/70 border border-surface-border hover:border-brand-200 rounded-xl text-left transition-all max-w-[280px] sm:max-w-xs"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                {activeGbpAccount?.clientLabel?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-ink-muted">Client Profile:</span>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded">
                    Agency
                  </span>
                </div>
                <p className="text-xs font-bold text-ink truncate">
                  {activeGbpAccount?.clientLabel || activeGbpAccount?.locationName}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />
            </button>

            {clientDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setClientDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-surface rounded-xl border border-surface-border shadow-xl z-50 py-2 divide-y divide-surface-border animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Select Client Location ({userGbpAccounts.length})
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {userGbpAccounts.map((acc) => {
                      const isSelected = acc.id === activeGbpAccountId;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setActiveGbpAccountId(acc.id);
                            setClientDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-brand-50/60 transition-colors ${
                            isSelected ? 'bg-brand-50 text-brand-900 font-semibold' : 'text-ink'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold truncate">
                              {acc.clientLabel || acc.locationName}
                            </p>
                            <p className="text-[10px] text-ink-muted truncate">
                              {acc.address || 'Google Business Profile'}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClientDropdownOpen(false);
                        navigate('/app/agency/clients');
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Manage / Add Clients
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : activeRole === 'single' ? (
          /* Single User location badge */
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-muted border border-surface-border rounded-xl">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <div className="min-w-0">
              <span className="text-[11px] text-ink-muted font-medium block leading-none">
                Connected Profile
              </span>
              <span className="text-xs font-bold text-ink truncate max-w-[200px] block">
                {activeGbpAccount?.locationName || 'Artisan Roast Hayes Valley'}
              </span>
            </div>
          </div>
        ) : (
          /* Super Admin Banner */
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800">
              Anthropic-Style Super Admin Control Panel
            </span>
          </div>
        )}
      </div>

      {/* Right side: Role Switcher Pill + Actions + User Avatar */}
      <div className="flex items-center gap-3">
        {/* Role Quick Switcher Pills (Essential for testing all 3 user roles effortlessly) */}
        <div className="hidden md:flex items-center bg-surface-muted p-1 rounded-xl border border-surface-border">
          <button
            type="button"
            onClick={() => switchUserRole('single')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'single'
                ? 'bg-surface text-brand-700 shadow-xs border border-brand-200'
                : 'text-ink-muted hover:text-ink'
            }`}
            title="Single business managing 1 GBP location"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Single User
          </button>
          <button
            type="button"
            onClick={() => switchUserRole('agency')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'agency'
                ? 'bg-surface text-brand-700 shadow-xs border border-brand-200'
                : 'text-ink-muted hover:text-ink'
            }`}
            title="Agency managing multiple client GBP profiles"
          >
            <Building2 className="w-3.5 h-3.5" />
            Agency
          </button>
          <button
            type="button"
            onClick={() => switchUserRole('super_admin')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeRole === 'super_admin'
                ? 'bg-surface text-emerald-700 shadow-xs border border-emerald-200'
                : 'text-ink-muted hover:text-ink'
            }`}
            title="Super Admin control panel: platform KPIs, users, pricing"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin
          </button>
        </div>

        {/* Marketing / Landing preview toggle */}
        <button
          type="button"
          onClick={() => navigate(currentPath === '/' ? '/app/dashboard' : '/')}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-surface-muted transition-colors border border-transparent hover:border-surface-border"
          title="Toggle between SaaS app and Marketing Landing page"
        >
          {currentPath === '/' ? (
            <>
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
              <span>Back to App</span>
            </>
          ) : (
            <>
              <Home className="w-3.5 h-3.5" />
              <span>Landing</span>
            </>
          )}
        </button>

        {/* Reset Demo Data button */}
        <button
          type="button"
          onClick={resetToDefaults}
          className="p-2 text-ink-muted hover:text-ink rounded-lg hover:bg-surface-muted transition-colors"
          title="Reset all demo data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* User profile avatar & menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-muted transition-colors"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-surface-border"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-ink leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-ink-muted capitalize">
                {activeRole.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl border border-surface-border shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-surface-border">
                  <p className="text-xs font-bold text-ink">{currentUser.name}</p>
                  <p className="text-[11px] text-ink-muted">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                    Role: {activeRole.toUpperCase()}
                  </span>
                </div>

                <div className="p-2 md:hidden">
                  <p className="text-[10px] uppercase font-semibold text-ink-muted px-2 mb-1">
                    Switch Role (Mobile):
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => {
                        switchUserRole('single');
                        setRoleDropdownOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs text-left rounded-lg ${
                        activeRole === 'single' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink'
                      }`}
                    >
                      Single User (Elena)
                    </button>
                    <button
                      onClick={() => {
                        switchUserRole('agency');
                        setRoleDropdownOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs text-left rounded-lg ${
                        activeRole === 'agency' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink'
                      }`}
                    >
                      Agency User (Marcus)
                    </button>
                    <button
                      onClick={() => {
                        switchUserRole('super_admin');
                        setRoleDropdownOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs text-left rounded-lg ${
                        activeRole === 'super_admin' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink'
                      }`}
                    >
                      Super Admin (Alex)
                    </button>
                  </div>
                </div>

                <div className="py-1 border-t border-surface-border">
                  <button
                    onClick={() => {
                      navigate('/app/settings/profile');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-ink hover:bg-surface-muted transition-colors"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      navigate('/app/settings/connections');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-ink hover:bg-surface-muted transition-colors"
                  >
                    GBP & LLM API Keys
                  </button>
                  <button
                    onClick={() => {
                      navigate('/login');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-xs text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out / Switch Account
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
