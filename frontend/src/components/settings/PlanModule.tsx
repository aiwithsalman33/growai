// src/components/settings/PlanModule.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { PricingPlan } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Calendar,
  Building2,
  Users,
  Check
} from 'lucide-react';

export const PlanModule: React.FC = () => {
  const {
    activeRole,
    currentUser,
    pricingPlans,
    upgradeUserPlan,
    addToast
  } = usePartner();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Identify Current Plan
  const currentPlan: PricingPlan =
    pricingPlans.find((p) => p.id === currentUser.planId) ||
    pricingPlans.find((p) => p.id === (activeRole === 'agency' ? 'plan-agency-pro' : 'plan-single-starter')) ||
    pricingPlans[0];

  // Identify Upgrade Plan ONLY
  // If single: Agency Pro Plan
  // If agency: Enterprise Scale Plan
  const upgradePlan: PricingPlan =
    activeRole === 'agency'
      ? pricingPlans.find((p) => p.id === 'plan-agency-scale') || {
          id: 'plan-agency-scale',
          name: 'Enterprise Scale Plan',
          priceMonthly: 499,
          maxGbpAccounts: 100,
          isAgencyPlan: true,
          aiReplyQuota: 10000,
          features: [
            'Unlimited Google Business Profile locations',
            '10,000 AI review replies per month',
            'Unlimited team member seats & client portals',
            'Custom white-label branding & custom domain',
            'Dedicated high-throughput Google API proxy',
            'Custom AI model fine-tuning & BYOK LLMs',
            'Dedicated Account Manager & 24/7 Slack support',
          ],
        }
      : pricingPlans.find((p) => p.id === 'plan-agency-pro') || {
          id: 'plan-agency-pro',
          name: 'Agency Pro Plan',
          priceMonthly: 199,
          maxGbpAccounts: 15,
          isAgencyPlan: true,
          aiReplyQuota: 2000,
          features: [
            'Up to 15 Connected Google Business Profiles',
            '2,000 AI review replies per month',
            '10 Team Member seats with role permissions',
            'Client management hub & cross-client switcher',
            'Separate LLM / BYOK API keys per client',
            'Multi-location bulk post scheduler & photo sync',
            'Automated monthly white-label PDF reports',
          ],
        };

  const handleExecuteUpgrade = async () => {
    setIsUpgrading(true);
    setTimeout(async () => {
      await upgradeUserPlan(upgradePlan.id);
      setIsUpgrading(false);
    }, 600);
  };

  const handleDownloadInvoice = () => {
    addToast({
      type: 'success',
      title: 'Invoice Downloaded',
      description: 'PDF for invoice #INV-2024-03-01 has been downloaded.',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink">Subscription Plan & Billing</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                Current Plan: {currentPlan.name}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Review your active subscription limits or upgrade seamlessly to expand capacity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-muted text-ink border border-surface-border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-brand-600" />
            <span>Payment Method</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-muted text-ink border border-surface-border flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Latest Invoice</span>
          </button>
        </div>
      </div>

      {/* EXACT REQUIREMENT: Show CURRENT PLAN and UPGRADE PLAN ONLY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* CARD 1: CURRENT PLAN */}
        <div className="bg-surface rounded-2xl border-2 border-brand-500 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative">
          <div className="absolute -top-3 left-6">
            <span className="px-3 py-1 bg-brand-600 text-white font-bold text-[11px] rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Current Active Plan
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <h4 className="text-lg font-black text-ink">{currentPlan.name}</h4>
                <p className="text-xs text-ink-muted mt-0.5">
                  Renewal date: April 1, 2024 • Visa ending in 4242
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-ink">${currentPlan.priceMonthly}</span>
                <span className="text-xs font-medium text-ink-muted"> / month</span>
              </div>
            </div>

            {/* Quota Highlights */}
            <div className="grid grid-cols-2 gap-3 my-5 p-3.5 bg-surface-muted rounded-xl border border-surface-border text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">GBP Locations</span>
                <span className="font-bold text-ink text-sm">
                  {currentPlan.maxGbpAccounts === 999 ? 'Unlimited' : `${currentPlan.maxGbpAccounts} Profile`}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">AI Reply Quota</span>
                <span className="font-bold text-brand-700 text-sm">
                  {(currentPlan.aiReplyQuota || 250).toLocaleString()} / month
                </span>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold text-ink uppercase tracking-wider text-[10px]">
                Included with your plan:
              </p>
              {currentPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-ink">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Subscription Active
            </span>
            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
            >
              Update Payment Card &rarr;
            </button>
          </div>
        </div>

        {/* CARD 2: UPGRADE PLAN ONLY */}
        <div className="bg-surface rounded-2xl border border-surface-border p-6 sm:p-7 shadow-xs flex flex-col justify-between relative bg-gradient-to-b from-brand-50/30 to-transparent">
          <div className="absolute -top-3 left-6">
            <span className="px-3 py-1 bg-brand-100 text-brand-800 border border-brand-200 font-bold text-[11px] rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" /> Recommended Upgrade
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <h4 className="text-lg font-black text-ink">{upgradePlan.name}</h4>
                <p className="text-xs text-brand-800 font-medium mt-0.5">
                  Unlock more scale, volume, and team collaboration
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-brand-700">${upgradePlan.priceMonthly}</span>
                <span className="text-xs font-medium text-ink-muted"> / month</span>
              </div>
            </div>

            {/* Quota Highlights */}
            <div className="grid grid-cols-2 gap-3 my-5 p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 text-xs">
              <div>
                <span className="text-brand-900 block text-[11px]">Expanded Locations</span>
                <span className="font-bold text-brand-900 text-sm">
                  {upgradePlan.maxGbpAccounts === 100 || upgradePlan.maxGbpAccounts === 999
                    ? 'Unlimited Profiles'
                    : `Up to ${upgradePlan.maxGbpAccounts} Profiles`}
                </span>
              </div>
              <div>
                <span className="text-brand-900 block text-[11px]">AI Reply Quota</span>
                <span className="font-bold text-brand-700 text-sm">
                  {(upgradePlan.aiReplyQuota || 2000).toLocaleString()} / month
                </span>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold text-ink uppercase tracking-wider text-[10px]">
                Everything in current plan, plus:
              </p>
              {upgradePlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-ink font-medium">
                  <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-surface-border">
            <button
              type="button"
              onClick={handleExecuteUpgrade}
              disabled={isUpgrading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>{isUpgrading ? 'Upgrading Your Account...' : `Upgrade to ${upgradePlan.name}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-center text-ink-muted mt-2">
              Instant activation • Prorated billing applies automatically
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-surface-border p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                Update Payment Method
              </h4>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-ink-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl font-mono text-ink font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    CVC
                  </label>
                  <input
                    type="password"
                    defaultValue="829"
                    maxLength={4}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl font-mono text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  addToast({
                    type: 'success',
                    title: 'Payment method updated',
                    description: 'Your default billing card has been saved securely.',
                  });
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
