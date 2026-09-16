// src/components/auth/PricingPage.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import { Sparkles, Check, ArrowRight, Building2, Users, ShieldCheck, ArrowLeft } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { pricingPlans, navigate } = usePartner();

  return (
    <div className="min-h-screen bg-surface-muted text-ink flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-ink font-sans">
              Partner<span className="text-brand-500">.ai</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-ink-muted hover:text-ink px-3 py-1.5 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={() => navigate('/login/user')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-surface-border text-ink hover:bg-surface-muted"
            >
              Single Login
            </button>
            <button
              onClick={() => navigate('/login/agency')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
            >
              Agency Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-16 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight mb-4">
          Transparent pricing for businesses & agencies
        </h1>
        <p className="text-base text-ink-muted leading-relaxed">
          Choose the exact plan tailored to your profile volume. All plans include 14-day free trials, Google Business API synchronization, and LLM reply automation.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.slice(0, 3).map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-8 flex flex-col relative transition-all ${
                plan.id === 'plan-agency-pro'
                  ? 'border-brand-500 shadow-lg ring-4 ring-brand-50'
                  : 'border-surface-border shadow-sm hover:border-gray-300'
              }`}
            >
              {plan.id === 'plan-agency-pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                  Most Popular for Agencies
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                {plan.isAgencyPlan ? (
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-700">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-700">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                  <span className="text-[11px] font-medium text-ink-muted">
                    {plan.isAgencyPlan ? 'Agency Workspace' : 'Single Business Location'}
                  </span>
                </div>
              </div>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-ink font-mono">${plan.priceMonthly}</span>
                  <span className="text-sm font-semibold text-ink-muted">/month</span>
                </div>
                <div className="text-xs text-brand-700 font-semibold mt-1">
                  {plan.maxGbpAccounts === 1
                    ? '1 Google Business Profile (locked)'
                    : `Up to ${plan.maxGbpAccounts} client locations included`}
                </div>
              </div>

              <ul className="space-y-3 text-xs text-ink mb-8 flex-1">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.isAgencyPlan) {
                    navigate('/signup/agency');
                  } else {
                    navigate('/signup/user');
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                  plan.id === 'plan-agency-pro'
                    ? 'bg-brand-600 hover:bg-brand-700 text-white'
                    : 'bg-brand-500 hover:bg-brand-600 text-white'
                }`}
              >
                <span>{plan.isAgencyPlan ? 'Start Agency Trial' : 'Start Single Business Trial'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
