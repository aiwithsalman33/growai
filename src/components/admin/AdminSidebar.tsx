// src/components/admin/AdminSidebar.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import {
  BarChart3,
  Users,
  Building2,
  DollarSign,
  Sliders,
  ShieldCheck,
  LogOut,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentPath, navigate, logout, currentUser } = usePartner();

  const navItems = [
    { label: 'Platform Telemetry', path: '/admin/dashboard', icon: BarChart3 },
    { label: 'Direct Single Users', path: '/admin/users', icon: Users },
    { label: 'Agency Partners', path: '/admin/agencies', icon: Building2 },
    { label: 'Pricing Plans Editor', path: '/admin/pricing', icon: DollarSign },
    { label: 'Global Infrastructure', path: '/admin/settings', icon: Sliders },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white text-ink border-r border-surface-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shadow-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-ink font-sans">
                Partner<span className="text-brand-600">.ai</span>
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-wider text-brand-700">
                Super Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* System Telemetry Badge */}
        <div className="p-3 border-b border-surface-border bg-surface-muted/60">
          <div className="flex items-center justify-between text-[10px] text-ink-muted font-mono mb-1">
            <span>PLATFORM HEALTH</span>
            <span className="flex items-center gap-1 text-brand-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              99.98%
            </span>
          </div>
          <div className="text-xs font-semibold text-ink">
            Anthropic & Google Sync Active
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/admin/dashboard' && currentPath === '/admin');

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 border border-brand-200/60 shadow-xs'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-muted/40 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-surface-border shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-brand-700 font-semibold truncate">Role: Super Admin</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign out of Admin"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
