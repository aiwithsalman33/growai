// src/components/agency/AgencyTopbar.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import {
  Menu,
  Users,
  PlusCircle,
  Building2,
  CheckCircle2,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface AgencyTopbarProps {
  onMenuClick: () => void;
}

export const AgencyTopbar: React.FC<AgencyTopbarProps> = ({ onMenuClick }) => {
  const { activeGbpAccount, navigate, logout, currentUser, userGbpAccounts } = usePartner();

  return (
    <header className="h-16 bg-white border-b border-surface-border px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-muted text-ink"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Agency Identity & Active Client Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-ink">
                {currentUser?.companyName || 'PeakScale Agency'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-brand-800 bg-brand-100 px-2 py-0.5 rounded-full">
                {userGbpAccounts.length} Connected Clients
              </span>
            </div>
            <div className="text-[10px] text-ink-muted hidden sm:block">
              Active Scope: <span className="font-semibold text-ink">{activeGbpAccount?.clientLabel || activeGbpAccount?.locationName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/agency/clients')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-muted border border-surface-border text-ink transition-colors shadow-xs"
        >
          <Building2 className="w-3.5 h-3.5 text-brand-600" />
          <span>Clients Directory</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/agency/posts/new')}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Post</span>
        </button>

        <div className="h-4 w-px bg-surface-border hidden sm:block" />

        <button
          type="button"
          onClick={logout}
          className="text-xs font-semibold text-ink-muted hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
