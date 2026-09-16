// src/components/admin/AdminTopbar.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import { useTheme } from '../../context/ThemeContext';
import {
  Menu,
  ShieldCheck,
  Activity,
  LogOut,
  Terminal,
  Cpu,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ onMenuClick }) => {
  const { adminPlatformStats, logout, currentUser } = usePartner();
  const { toggleTheme, theme } = useTheme();

  return (
    <header className="h-16 bg-white text-ink border-b border-surface-border px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 font-sans">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-muted text-ink"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-ink">
                Super Admin Operations
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                Root Control
              </span>
            </div>
            <div className="text-[10px] text-ink-muted hidden sm:block">
              Platform Architecture & Multi-Tenant Management
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-xl bg-surface-muted border border-surface-border text-[11px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-600" />
            <span>LLM: Claude 3.5 Sonnet</span>
          </div>
          <div className="h-3 w-px bg-surface-border" />
          <div>
            API Quota: <span className="text-brand-700 font-bold">{adminPlatformStats.googleApiQuotaUsed}%</span>
          </div>
          <div className="h-3 w-px bg-surface-border" />
          <div>
            MRR: <span className="text-ink font-bold">${adminPlatformStats.mrr.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="text-xs font-semibold text-ink-muted hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 font-sans"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin Exit</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="text-xs font-semibold text-ink-muted hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
        </button>
      </div>
    </header>
  );
};
