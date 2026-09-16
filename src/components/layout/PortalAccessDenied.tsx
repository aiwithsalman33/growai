// src/components/layout/PortalAccessDenied.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import { ShieldAlert, ArrowRight, LogOut, ArrowLeft } from 'lucide-react';
import { UserRole } from '../../types';

interface PortalAccessDeniedProps {
  requiredRole: UserRole;
}

export const PortalAccessDenied: React.FC<PortalAccessDeniedProps> = ({ requiredRole }) => {
  const { activeRole, currentUser, navigate, logout } = usePartner();

  const roleNames: Record<UserRole, string> = {
    single: 'Single Business User',
    agency: 'Agency Partner',
    super_admin: 'Super Admin',
    admin: 'Super Admin',
  };

  const portalLogins: Record<UserRole, string> = {
    single: '/login/user',
    agency: '/login/agency',
    super_admin: '/login/admin',
    admin: '/login/admin',
  };

  const userHomePaths: Record<UserRole, string> = {
    single: '/user/dashboard',
    agency: '/agency/dashboard',
    super_admin: '/admin/dashboard',
    admin: '/admin/dashboard',
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-surface-border p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
          Separate Panel Boundary
        </span>

        <h2 className="text-xl font-extrabold text-ink mt-3 mb-2">
          Portal Access Restricted
        </h2>

        <p className="text-xs text-ink-muted leading-relaxed mb-6">
          You are currently signed in as a <span className="font-bold text-ink">{roleNames[activeRole]}</span> ({currentUser?.email}).
          This panel is dedicated exclusively to <span className="font-bold text-ink">{roleNames[requiredRole]}</span> accounts.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(userHomePaths[activeRole])}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Panel ({roleNames[activeRole]})</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate(portalLogins[requiredRole]);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-muted hover:bg-gray-200 text-ink transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500" />
            <span>Sign Out & Go to {roleNames[requiredRole]} Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
