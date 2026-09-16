// src/components/settings/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { usePartner } from '../../lib/store';
import {
  User,
  Building2,
  Bot,
  DollarSign,
  CreditCard,
  Users,
  Settings as SettingsIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

import { ProfileCrudModule } from './ProfileCrudModule';
import { GbpConnectionModule } from './GbpConnectionModule';
import { AiConnectionModule } from './AiConnectionModule';
import { AiUsageCostModule } from './AiUsageCostModule';
import { PlanModule } from './PlanModule';
import { AgencyTeamModule } from './AgencyTeamModule';

export type SettingsTab =
  | 'profile'
  | 'gbp'
  | 'ai-agent'
  | 'ai-usage'
  | 'plan'
  | 'team';

interface SettingsPageProps {
  initialTab?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab = 'profile' }) => {
  const { activeRole, activeGbpAccount, gbpAccounts } = usePartner();

  // Map initial tab string to valid SettingsTab
  const normalizeTab = (tab?: string): SettingsTab => {
    if (!tab) return 'profile';
    const lower = tab.toLowerCase();
    if (lower === 'gbp' || lower === 'connections' || lower === 'google') return 'gbp';
    if (lower === 'ai-agent' || lower === 'ai' || lower === 'llm' || lower === 'agent') return 'ai-agent';
    if (lower === 'ai-usage' || lower === 'usage' || lower === 'cost') return 'ai-usage';
    if (lower === 'plan' || lower === 'billing' || lower === 'plans') return 'plan';
    if (lower === 'team') return 'team';
    if (lower === 'profile') return 'profile';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(normalizeTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; agencyOnly?: boolean }[] = [
    {
      id: 'profile',
      label: 'Profile & GBP Accounts',
      icon: Users,
      badge: `${gbpAccounts?.length ?? 0}`,
    },
    {
      id: 'gbp',
      label: 'Google Business Profile',
      icon: Building2,
      badge: 'Active Sync',
    },
    {
      id: 'ai-agent',
      label: 'LLM & AI Agent',
      icon: Bot,
      badge: activeRole === 'agency' ? 'BYOK Available' : undefined,
    },
    {
      id: 'ai-usage',
      label: 'AI Usage & Cost',
      icon: DollarSign,
    },
    {
      id: 'plan',
      label: 'Plan & Billing',
      icon: CreditCard,
    },
    ...(activeRole === 'agency'
      ? [
          {
            id: 'team' as SettingsTab,
            label: 'Agency Team',
            icon: Users,
            agencyOnly: true,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shadow-xs">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-ink tracking-tight">System Settings</h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
              {activeRole === 'agency' ? 'Agency Management' : 'Single Business Portal'}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Manage your connected Google Business Profiles, AI agent behaviors, token billing, and subscription plans.
          </p>
        </div>

        {activeGbpAccount && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface rounded-xl border border-surface-border text-xs shadow-xs self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-ink-muted">Scoped Location:</span>
            <span className="font-bold text-ink truncate max-w-[180px]">{activeGbpAccount?.locationName}</span>
          </div>
        )}
      </div>

      {/* Horizontal Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-ink-muted hover:text-ink hover:bg-surface'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-brand-700/80 text-white' : 'bg-brand-50 text-brand-700 border border-brand-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Module Rendering */}
      <div className="pt-2">
        {activeTab === 'profile' && <ProfileCrudModule />}
        {activeTab === 'gbp' && <GbpConnectionModule />}
        {activeTab === 'ai-agent' && <AiConnectionModule />}
        {activeTab === 'ai-usage' && <AiUsageCostModule />}
        {activeTab === 'plan' && <PlanModule />}
        {activeTab === 'team' && activeRole === 'agency' && <AgencyTeamModule />}
      </div>
    </div>
  );
};
