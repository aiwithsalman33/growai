// src/components/auth/MarketingLandingPage.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import {
  Sparkles,
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Star,
  BarChart3,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  KeyRound,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const MarketingLandingPage: React.FC = () => {
  const { navigate } = usePartner();

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col text-ink selection:bg-brand-100 selection:text-brand-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-ink font-sans">
                Partner<span className="text-brand-500">.ai</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-md">
                GBP Micro-SaaS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-muted">
            <button
              onClick={() => navigate('/pricing')}
              className="hover:text-ink transition-colors font-medium"
            >
              Pricing & Plans
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('panels-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-ink transition-colors font-medium"
            >
              The 3 Panels
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-ink transition-colors font-medium"
            >
              Core Capabilities
            </button>
          </div>

          {/* Quick Login Hub in Header */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                type="button"
                className="px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink bg-surface rounded-lg border border-surface-border hover:border-gray-300 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>Login Portals</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-400" />
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-border rounded-xl shadow-xl py-2 hidden group-hover:block transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Choose Your Login Panel
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login/user')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 flex items-center gap-2 text-ink hover:text-brand-700 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Single Business User</div>
                    <div className="text-[10px] text-ink-muted">Manage 1 GBP profile</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login/agency')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-brand-50 flex items-center gap-2 text-ink hover:text-brand-700 transition-colors"
                >
                  <Users className="w-4 h-4 text-brand-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Agency Partner</div>
                    <div className="text-[10px] text-ink-muted">Manage multi-client profiles</div>
                  </div>
                </button>
                <div className="my-1 border-t border-surface-border" />
                <button
                  type="button"
                  onClick={() => navigate('/login/admin')}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center gap-2 text-ink-muted hover:text-ink transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <div className="font-semibold">Super Admin Portal</div>
                    <div className="text-[10px] text-ink-muted">Platform telemetry & controls</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/signup/user')}
              className="px-4 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all shadow-sm hover:shadow-brand-500/20"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Built Specifically for Google Business Profile Automation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink mb-6 font-display leading-[1.15]">
            Supercharge your local visibility with <span className="text-brand-500">AI-driven</span> GBP management
          </h1>

          <p className="text-lg sm:text-xl text-ink-muted max-w-3xl mx-auto mb-10 leading-relaxed font-sans">
            One platform crafted with three dedicated, completely isolated panels: for local businesses, marketing agencies, and platform administrators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/signup/user')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all shadow-md hover:shadow-brand-500/30 flex items-center justify-center gap-2"
            >
              <span>Start Single Business Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/signup/agency')}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold bg-white hover:bg-surface-muted text-ink border border-surface-border rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-brand-600" />
              <span>Agency Onboarding</span>
            </button>
          </div>
        </div>
      </section>

      {/* THREE SEPARATE PANELS HIGHLIGHT SECTION */}
      <section id="panels-section" className="py-16 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Three Independent Environments
            </h2>
            <h3 className="text-3xl font-extrabold text-ink tracking-tight">
              Separate Logins. Separate Panels. Dedicated Workflows.
            </h3>
            <p className="text-sm text-ink-muted mt-2">
              Each user role has its own dedicated login gateway, isolated sidebar navigation, and specialized permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Panel 1: Single User */}
            <div className="bg-surface rounded-2xl border-2 border-surface-border hover:border-brand-500 transition-all p-6 sm:p-8 flex flex-col relative shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-bold text-ink">Single User Panel</h4>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  1 Business
                </span>
              </div>

              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                Connects exactly 1 Google Business Profile location. Streamlined for local restaurant, salon, retail, or clinic owners.
              </p>

              <div className="space-y-2.5 text-xs text-ink mb-8 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Connect 1 GBP account (locked)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Local Search & Maps KPI dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Scheduled Posts (What&apos;s New, Event, Offer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>AI Review replies with brand persona</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Photo category uploader</span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border space-y-2">
                <button
                  onClick={() => navigate('/login/user')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Single User Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('/signup/user')}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors text-center"
                >
                  Create single user account
                </button>
              </div>
            </div>

            {/* Panel 2: Agency User */}
            <div className="bg-surface rounded-2xl border-2 border-brand-500/40 hover:border-brand-500 transition-all p-6 sm:p-8 flex flex-col relative shadow-sm hover:shadow-lg ring-4 ring-brand-50">
              <div className="absolute -top-3 right-6 bg-brand-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider shadow-xs">
                Agency Pro
              </div>

              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-bold text-ink">Agency Partner Panel</h4>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                  Multi-Client
                </span>
              </div>

              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                Connect and manage unlimited client GBP accounts under one login with client switcher and agency-wide rollups.
              </p>

              <div className="space-y-2.5 text-xs text-ink mb-8 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Instant Client Switcher across accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Aggregated cross-client KPI rollups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Client Comparison & Health Benchmark table</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Per-client AI personas & auto-reply gates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Team collaboration & role invitations</span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border space-y-2">
                <button
                  onClick={() => navigate('/login/agency')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Agency Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('/signup/agency')}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors text-center"
                >
                  Start 14-day agency trial
                </button>
              </div>
            </div>

            {/* Panel 3: Super Admin */}
            <div className="bg-surface rounded-2xl border-2 border-surface-border hover:border-gray-800 transition-all p-6 sm:p-8 flex flex-col relative shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-bold text-ink">Super Admin Portal</h4>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 font-mono">
                  Internal Only
                </span>
              </div>

              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                Platform-wide control center for managing all direct users, agencies, telemetry, MRR, plans, and system fallbacks.
              </p>

              <div className="space-y-2.5 text-xs text-ink mb-8 flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                  <span>Platform MRR & Churn telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                  <span>Single & Agency user directories</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                  <span>One-click Tenant Impersonation for support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                  <span>Pricing Tier & quota management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                  <span>Global LLM provider & rate limits</span>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border space-y-2">
                <button
                  onClick={() => navigate('/login/admin')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-black text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                  <span>Admin Gateway Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-[11px] text-center text-ink-muted py-2">
                  Mandatory 2FA + Authorized IP required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section id="features-section" className="py-20 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Micro-SaaS Capabilities
            </h2>
            <h3 className="text-3xl font-extrabold text-ink tracking-tight">
              Everything required to dominate Google Maps rankings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1.5">Actionable KPIs</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Track phone calls, direction requests, website clicks, and search queries directly from Google Business API.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1.5">AI Review Agent</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Draft replies in your custom brand voice with safety guardrails that auto-approve 5-star reviews while flagging critical feedback.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1.5">GBP Post Scheduler</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Publish What&apos;s New, Events, Offers, and Products with CTA targets and image formatting hints for maximum engagement.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-ink mb-1.5">Photo Categorizer</h4>
              <p className="text-xs text-ink-muted leading-relaxed">
                Upload and categorize images across Interior, Exterior, Team, and At Work tags to improve Google Maps trust signals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-surface-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span className="font-bold text-ink">Partner.ai</span>
            <span>— The micro-SaaS for Google Business Profile automation</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login/user')} className="hover:text-ink">
              Single User Login
            </button>
            <button onClick={() => navigate('/login/agency')} className="hover:text-ink">
              Agency Login
            </button>
            <button onClick={() => navigate('/login/admin')} className="hover:text-ink">
              Admin Portal
            </button>
            <button onClick={() => navigate('/pricing')} className="hover:text-ink">
              Pricing
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
