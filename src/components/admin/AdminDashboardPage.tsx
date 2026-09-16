// src/components/admin/AdminDashboardPage.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { UserRole, PricingPlan } from '../../types';
import {
  ShieldAlert,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  MoreVertical,
  Settings,
  CreditCard,
  Edit2,
  Sparkles,
  Save
} from 'lucide-react';

interface AdminDashboardPageProps {
  initialTab?: 'overview' | 'users' | 'agencies' | 'plans' | 'system';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ initialTab = 'overview' }) => {
  const {
    adminPlatformStats,
    allUsers,
    pricingPlans,
    updatePricingPlan,
    impersonateUser,
    activeRole,
    addToast
  } = usePartner();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'agencies' | 'plans' | 'system'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  // System settings state
  const [defaultModel, setDefaultModel] = useState('claude-3-5-sonnet');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(120);

  const filteredUsers = allUsers.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.companyName && u.companyName.toLowerCase().includes(q))
    );
  });

  const agencyUsers = allUsers.filter((u) => u.role === 'agency');

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    await updatePricingPlan(editingPlan.id, editingPlan);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Super Admin Top Banner */}
      <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">Super Admin Operations Center</h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
              Internal Control Panel
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Platform-wide metrics, tenant billing status, user impersonation, and global GBP infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left sm:text-right">
            <p className="text-xs text-ink-muted">Total Run-rate ARR</p>
            <p className="text-xl font-mono font-black text-brand-700">
              ${(adminPlatformStats.mrr * 12).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Platform Telemetry' },
          { id: 'users', label: `All Tenants (${allUsers.length})` },
          { id: 'agencies', label: `Agencies (${agencyUsers.length})` },
          { id: 'plans', label: `Pricing Tiers (${pricingPlans.length})` },
          { id: 'system', label: 'Global Infrastructure' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-ink-muted hover:text-ink hover:bg-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Financial & Tenant Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">Monthly Revenue (MRR)</p>
              <p className="text-2xl font-black text-ink mt-1">
                ${adminPlatformStats.mrr.toLocaleString()}
              </p>
              <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-2">
                +14.2% MoM
              </span>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">Total Accounts</p>
              <p className="text-2xl font-black text-ink mt-1">
                {adminPlatformStats.totalUsers.toLocaleString()}
              </p>
              <span className="text-[11px] text-ink-muted block mt-2">
                {adminPlatformStats.singleUsers} Single • {adminPlatformStats.agencyUsers} Agencies
              </span>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">Connected GBP Locations</p>
              <p className="text-2xl font-black text-ink mt-1">
                {adminPlatformStats.totalGbpLocations.toLocaleString()}
              </p>
              <span className="text-[11px] text-brand-700 font-medium block mt-2">99.8% Sync Rate</span>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">Churn Rate</p>
              <p className="text-2xl font-black text-ink mt-1">
                {adminPlatformStats.churnRate}%
              </p>
              <span className="text-[11px] text-brand-700 font-medium block mt-2">-0.3% vs target</span>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">LLM Tokens / Mo</p>
              <p className="text-2xl font-black text-ink mt-1">
                {(adminPlatformStats.totalTokensMonth / 1000000).toFixed(1)}M
              </p>
              <span className="text-[11px] text-ink-muted block mt-2">Anthropic + OpenAI</span>
            </div>

            <div className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs">
              <p className="text-xs font-semibold text-ink-muted">Google API Quota</p>
              <p className="text-2xl font-black text-ink mt-1">
                {adminPlatformStats.googleApiQuotaUsed}%
              </p>
              <div className="w-full bg-gray-100 rounded-full h-1 mt-3 overflow-hidden">
                <div
                  className="bg-brand-500 h-1 rounded-full"
                  style={{ width: `${adminPlatformStats.googleApiQuotaUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Infrastructure Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-600" /> External API & Sync Pipelines
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div>
                    <p className="font-bold text-ink">Google My Business API (v4.9)</p>
                    <p className="text-ink-muted text-[11px]">OAuth Refresh Tokens & Webhooks</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-brand-600" /> Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div>
                    <p className="font-bold text-ink">Anthropic Claude 3.5 Sonnet</p>
                    <p className="text-ink-muted text-[11px]">Avg Latency: 420ms</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-brand-600" /> Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-xl border border-surface-border">
                  <div>
                    <p className="font-bold text-ink">Scheduled Post Cron Worker</p>
                    <p className="text-ink-muted text-[11px]">Dispatched 48 posts today</p>
                  </div>
                  <span className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-brand-600" /> Healthy
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Impersonation Sandbox */}
            <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <LogIn className="w-4 h-4 text-brand-600" /> One-Click User Impersonation
              </h3>
              <p className="text-xs text-ink-muted">
                Audit or assist any customer by instantly logging in as their account with read/write access.
              </p>

              <div className="space-y-2">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-surface-muted rounded-xl border border-surface-border text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink">{user.name}</p>
                      <p className="text-[11px] text-ink-muted">
                        {user.companyName} • {user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => impersonateUser(user.id)}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <LogIn className="w-3 h-3" /> Impersonate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENANT USER MANAGEMENT TABLE */}
      {activeTab === 'users' && (
        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Tenant Accounts Directory</h3>
              <p className="text-xs text-ink-muted">
                Inspect plans, status, and manage access privileges across all direct and agency tenants.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Tenant & Company</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Active Plan</th>
                  <th className="pb-3 px-3">Locations</th>
                  <th className="pb-3 px-3">Joined Date</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-bold text-ink">{user.name}</p>
                        <p className="text-[11px] text-ink-muted">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-ink">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-brand-800">
                      {user.role === 'agency'
                        ? 'Agency Pro ($199)'
                        : user.role === 'super_admin' || user.role === 'admin'
                        ? 'Internal Staff'
                        : 'Single Pro ($59)'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-ink">
                      {user.role === 'agency' ? '3 profiles' : '1 profile'}
                    </td>
                    <td className="py-3 px-3 text-ink-muted">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-brand-600" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => impersonateUser(user.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 rounded-lg border border-brand-200 transition-colors inline-flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" /> Impersonate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AGENCIES DIRECTORY */}
      {activeTab === 'agencies' && (
        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-ink">Agency Partners Directory</h3>
          <p className="text-xs text-ink-muted">
            High-value agency accounts managing multi-location Google Business Portfolios.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyUsers.map((agency) => (
              <div
                key={agency.id}
                className="p-5 bg-surface-muted rounded-2xl border border-surface-border space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                      {agency.companyName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{agency.companyName}</h4>
                      <p className="text-xs text-ink-muted">Contact: {agency.name} ({agency.email})</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-800 bg-brand-100 px-2.5 py-1 rounded-full">
                    $199 / mo
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs p-2 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <span className="text-ink-muted text-[10px] block">Client Locations</span>
                    <span className="font-bold text-ink">3 Managed</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[10px] block">Team Members</span>
                    <span className="font-bold text-ink">3 Seats</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[10px] block">Joined</span>
                    <span className="font-bold text-ink">Feb 2024</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-ink-muted">Last active: 10 minutes ago</span>
                  <button
                    type="button"
                    onClick={() => impersonateUser(agency.id)}
                    className="px-3 py-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Log in as Agency
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRICING PLANS MANAGER */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Global Pricing Plans & Quotas</h3>
              <p className="text-xs text-ink-muted">
                Adjust tiers, GBP profile caps, and AI reply allowances.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-surface rounded-2xl border border-surface-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-ink">{plan.name}</h4>
                    <span className="text-xs font-mono font-bold text-brand-700">
                      ${plan.priceMonthly}/mo
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-ink-muted mb-4">
                    <p className="font-medium text-ink">
                      Max GBP Accounts: <span className="font-bold">{plan.maxGbpAccounts}</span>
                    </p>
                    <p className="font-medium text-ink">
                      AI Replies / Mo: <span className="font-bold">{plan.aiReplyQuota}</span>
                    </p>
                  </div>

                  <ul className="space-y-1 text-[11px] text-ink-muted mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingPlan(plan)}
                  className="w-full py-1.5 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-brand-50 text-ink border border-surface-border transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Plan Tier
                </button>
              </div>
            ))}
          </div>

          {/* Edit Plan Modal */}
          {editingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto">
              <div className="bg-surface rounded-2xl border border-surface-border shadow-2xl max-w-md w-full my-auto max-h-[92vh] flex flex-col p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Edit Plan: {editingPlan.name}</h3>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="p-1 text-ink-muted hover:text-ink rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSavePlan} className="space-y-3 overflow-y-auto flex-1">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      value={editingPlan.priceMonthly}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      Max GBP Accounts
                    </label>
                    <input
                      type="number"
                      value={editingPlan.maxGbpAccounts}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, maxGbpAccounts: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      AI Replies Quota
                    </label>
                    <input
                      type="number"
                      value={editingPlan.aiReplyQuota}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, aiReplyQuota: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-surface-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-ink-muted hover:text-ink text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 sm:py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors text-center"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM & GLOBAL SETTINGS */}
      {activeTab === 'system' && (
        <div className="bg-surface rounded-2xl border border-surface-border p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-ink">System Infrastructure & Global Controls</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Default LLM fallbacks, maintenance windows, and rate limit protections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Default Platform AI Model Fallback
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                  <option value="gpt-4o">GPT-4o (OpenAI)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
                </select>
                <p className="text-[10px] text-ink-muted mt-1">
                  Used when tenant does not provide custom BYOK credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Global Rate Limit (Requests per minute per tenant)
                </label>
                <input
                  type="number"
                  value={rateLimitPerMinute}
                  onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-surface border border-surface-border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-surface-muted rounded-xl border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink">Maintenance Mode Banner</h4>
                  <p className="text-[11px] text-ink-muted">
                    Display an informative banner to all tenants during Google API migration windows.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {maintenanceMode && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Notice Active
                  </p>
                  <p className="text-[11px] mt-1">
                    "Google Business API sync is undergoing routine indexing maintenance. Live posting is queued."
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => {
                addToast({
                  type: 'success',
                  title: 'System Settings Saved',
                  description: 'Global fallback parameters updated successfully.',
                });
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Save Infrastructure Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
