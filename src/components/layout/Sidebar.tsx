// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Users,
  Building2,
  Settings,
  CreditCard,
  KeyRound,
  User,
  ShieldCheck,
  BarChart3,
  Sliders,
  DollarSign,
  PlusCircle,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentPath, navigate, activeRole, activeGbpAccount, userGbpAccounts } = usePartner();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCurrent = (path: string) => {
    if (path === '/app/posts' && currentPath.startsWith('/app/posts')) return true;
    if (path === '/app/reviews' && currentPath.startsWith('/app/reviews')) return true;
    if (path === '/app/photos' && currentPath.startsWith('/app/photos')) return true;
    if (path === '/app/agency/clients' && currentPath.startsWith('/app/agency/clients')) return true;
    return currentPath === path;
  };

  const navLinkClass = (path: string) => {
    const active = isCurrent(path);
    return `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
      active
        ? 'bg-brand-50 text-brand-800 font-semibold shadow-xs'
        : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
    }`;
  };

  const navIndicator = (path: string) => {
    const active = isCurrent(path);
    if (!active) return null;
    return (
      <span className="absolute left-0 top-2 bottom-2 w-1 bg-brand-500 rounded-r-full" />
    );
  };

  const NavContent = () => (
    <div className="h-full flex flex-col justify-between py-5 px-4 overflow-y-auto">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex items-center justify-between px-2 mb-7">
          <button
            type="button"
            onClick={() => {
              navigate('/app/dashboard');
              setMobileOpen(false);
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-brand-500/20 group-hover:bg-brand-600 transition-colors">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-ink">Partner.ai</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-brand-100 text-brand-800 rounded">
                  GBP
                </span>
              </div>
              <p className="text-[11px] text-ink-muted -mt-0.5">Google Business Hub</p>
            </div>
          </button>

          {/* Close for mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-ink-muted hover:text-ink rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-6">
          {/* Main GBP Management (Standard for Single & Agency) */}
          {activeRole !== 'super_admin' ? (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                Business Profile
              </p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/dashboard');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/dashboard')}
                >
                  {navIndicator('/app/dashboard')}
                  <LayoutDashboard className={`w-4 h-4 ${isCurrent('/app/dashboard') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/posts');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/posts')}
                >
                  {navIndicator('/app/posts')}
                  <FileText className={`w-4 h-4 ${isCurrent('/app/posts') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span className="flex-1 text-left">Post Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/reviews');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/reviews')}
                >
                  {navIndicator('/app/reviews')}
                  <MessageSquare className={`w-4 h-4 ${isCurrent('/app/reviews') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span className="flex-1 text-left">Reviews Inbox</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full">
                    AI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/photos');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/photos')}
                >
                  {navIndicator('/app/photos')}
                  <ImageIcon className={`w-4 h-4 ${isCurrent('/app/photos') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Photos & Media</span>
                </button>
              </nav>
            </div>
          ) : null}

          {/* Agency Modules (Agency role only) */}
          {activeRole === 'agency' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-brand-700 mb-2 flex items-center justify-between">
                <span>Agency Hub</span>
                <span className="text-[9px] bg-brand-100 px-1.5 py-0.5 rounded font-bold">
                  {userGbpAccounts.length} Clients
                </span>
              </p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/agency/clients');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/agency/clients')}
                >
                  {navIndicator('/app/agency/clients')}
                  <Building2 className={`w-4 h-4 ${isCurrent('/app/agency/clients') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Client Accounts</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/agency/team');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/app/agency/team')}
                >
                  {navIndicator('/app/agency/team')}
                  <Users className={`w-4 h-4 ${isCurrent('/app/agency/team') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Agency Team</span>
                </button>
              </nav>
            </div>
          )}

          {/* Super Admin Control Panel (Super Admin only) */}
          {activeRole === 'super_admin' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                Super Admin Control
              </p>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/admin/dashboard')}
                >
                  {navIndicator('/admin/dashboard')}
                  <BarChart3 className={`w-4 h-4 ${isCurrent('/admin/dashboard') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Platform KPIs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/users');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/admin/users')}
                >
                  {navIndicator('/admin/users')}
                  <User className={`w-4 h-4 ${isCurrent('/admin/users') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Single Users</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/agencies');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/admin/agencies')}
                >
                  {navIndicator('/admin/agencies')}
                  <Building2 className={`w-4 h-4 ${isCurrent('/admin/agencies') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Agencies & Clients</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/pricing');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/admin/pricing')}
                >
                  {navIndicator('/admin/pricing')}
                  <DollarSign className={`w-4 h-4 ${isCurrent('/admin/pricing') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Pricing Plans</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin/settings');
                    setMobileOpen(false);
                  }}
                  className={navLinkClass('/admin/settings')}
                >
                  {navIndicator('/admin/settings')}
                  <Sliders className={`w-4 h-4 ${isCurrent('/admin/settings') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                  <span>Global Config</span>
                </button>
              </nav>
            </div>
          )}

          {/* Configuration & Settings */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-2">
              Settings & API
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  navigate('/app/settings/connections');
                  setMobileOpen(false);
                }}
                className={navLinkClass('/app/settings/connections')}
              >
                {navIndicator('/app/settings/connections')}
                <KeyRound className={`w-4 h-4 ${isCurrent('/app/settings/connections') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                <span>GBP & LLM Keys</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/app/settings/billing');
                  setMobileOpen(false);
                }}
                className={navLinkClass('/app/settings/billing')}
              >
                {navIndicator('/app/settings/billing')}
                <CreditCard className={`w-4 h-4 ${isCurrent('/app/settings/billing') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                <span>Subscription Plan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/app/settings/profile');
                  setMobileOpen(false);
                }}
                className={navLinkClass('/app/settings/profile')}
              >
                {navIndicator('/app/settings/profile')}
                <Settings className={`w-4 h-4 ${isCurrent('/app/settings/profile') ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink'}`} />
                <span>Profile & Persona</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Profile Badge & Status */}
      <div className="pt-4 border-t border-surface-border">
        {activeRole === 'single' && (
          <div className="p-3 bg-brand-50/70 border border-brand-200 rounded-xl">
            <div className="flex items-center gap-1.5 text-brand-800 font-semibold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Need Multi-Location?</span>
            </div>
            <p className="text-[11px] text-brand-900/80 mb-2 leading-tight">
              Upgrade to Agency Plan to manage unlimited client GBP profiles.
            </p>
            <button
              type="button"
              onClick={() => {
                navigate('/app/settings/billing');
                setMobileOpen(false);
              }}
              className="w-full py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Upgrade Now <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-ink-muted">
          <span>API Status: Live</span>
          <span className="flex items-center gap-1 text-brand-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Syncing
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-3 bg-brand-600 text-white rounded-2xl shadow-lg hover:bg-brand-700 transition-colors flex items-center gap-2 font-medium text-xs"
        >
          <Menu className="w-4 h-4" /> Menu
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-surface border-r border-surface-border transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
};
