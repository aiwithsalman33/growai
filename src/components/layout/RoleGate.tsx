// src/components/layout/RoleGate.tsx
import React from 'react';
import { UserRole } from '../../types';
import { usePartner } from '../../lib/store';
import { ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  children,
  fallbackTitle = 'Restricted Access',
  fallbackDescription = 'This module is restricted to agency partners and administrators.',
}) => {
  const { activeRole, switchUserRole, navigate } = usePartner();

  if (allowedRoles.includes(activeRole)) {
    return <>{children}</>;
  }

  const isAgencyOnly = allowedRoles.includes('agency') && !allowedRoles.includes('single');
  const isAdminOnly = allowedRoles.includes('super_admin');

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-surface rounded-2xl border border-surface-border shadow-sm text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-5">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">{fallbackTitle}</h2>
      <p className="text-sm text-ink-muted mb-6 leading-relaxed">
        {fallbackDescription}
      </p>

      {isAgencyOnly && (
        <div className="bg-brand-50/60 border border-brand-200 rounded-xl p-4 text-left mb-6">
          <div className="flex items-center gap-2 text-brand-800 font-semibold text-sm mb-1">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Upgrade to Agency Plan
          </div>
          <p className="text-xs text-brand-900/80 leading-relaxed mb-3">
            Manage multiple client Google Business Profiles, invite team seats, and unlock client comparison reports.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/settings/billing')}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              View Agency Pricing <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => switchUserRole('agency')}
              className="px-3 py-2 text-xs font-medium text-brand-800 hover:bg-brand-100 rounded-lg transition-colors"
            >
              Simulate Agency Mode
            </button>
          </div>
        </div>
      )}

      {isAdminOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
          <p className="text-xs text-amber-900 leading-relaxed mb-3">
            This screen is restricted to Partner.ai internal team members and super administrators.
          </p>
          <button
            onClick={() => switchUserRole('super_admin')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            Switch to Super Admin View
          </button>
        </div>
      )}

      <button
        onClick={() => navigate('/app/dashboard')}
        className="text-xs text-ink-muted hover:text-ink transition-colors underline"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
