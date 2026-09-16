// src/components/user/UserTopbar.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import {
  Menu,
  Sparkles,
  PlusCircle,
  Building2,
  CheckCircle2,
  LogOut,
  Bell,
  ArrowRight
} from 'lucide-react';

interface UserTopbarProps {
  onMenuClick: () => void;
}

export const UserTopbar: React.FC<UserTopbarProps> = ({ onMenuClick }) => {
  const { activeGbpAccount, navigate, logout, currentUser } = usePartner();

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

        {/* Business Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-ink">
                {activeGbpAccount?.locationName || 'Artisan Roast & Bakery'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                <CheckCircle2 className="w-3 h-3 text-brand-600" /> Connected
              </span>
            </div>
            <div className="text-[10px] text-ink-muted hidden sm:block">
              Single Business Plan • Google Maps sync active
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/user/posts/new')}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Create Post</span>
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
