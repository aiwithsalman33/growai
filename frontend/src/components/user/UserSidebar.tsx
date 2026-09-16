// src/components/user/UserSidebar.tsx
import React from 'react';
import { usePartner } from '../../lib/store';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Building2,
  Sparkles,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface UserSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentPath, navigate, logout, currentUser, activeGbpAccount } = usePartner();

  const navItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Posts & Updates', path: '/user/posts', icon: Calendar },
    { label: 'Reviews & AI Replies', path: '/user/reviews', icon: MessageSquare },
    { label: 'Photos & Media', path: '/user/photos', icon: ImageIcon },
    { label: 'Settings', path: '/user/settings/profile', icon: Settings },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-surface-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-ink">
                Partner<span className="text-brand-500">.ai</span>
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-wider text-brand-700">
                Single Business
              </span>
            </div>
          </div>
        </div>

        {/* Connected Business Location Card (Locked to 1) */}
        <div className="p-4 border-b border-surface-border bg-surface-muted/60">
          <div className="text-[10px] uppercase font-bold text-ink-muted tracking-wider mb-1.5 flex items-center justify-between">
            <span>Active Business Profile</span>
            <span className="text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.2 text-[9px] rounded font-semibold">
              1 of 1
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-surface-border shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-ink truncate">
                {activeGbpAccount?.locationName || 'Artisan Roast & Bakery'}
              </div>
              <div className="text-[10px] text-ink-muted truncate">
                {activeGbpAccount?.address || 'Google Maps Verified'}
              </div>
            </div>
          </div>

          {/* Upgrade prompt for single user */}
          <div className="mt-3 p-2.5 bg-brand-50/50 rounded-xl border border-brand-200 text-[11px] text-brand-900 flex items-center justify-between">
            <span className="text-[10px] text-ink-muted font-medium">Need multi-location?</span>
            <button
              onClick={() => navigate('/user/settings/plan')}
              className="text-[10px] font-bold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
            >
              <span>Agency Plan</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath.startsWith(item.path) ||
              (item.path.startsWith('/user/settings') && currentPath.startsWith('/user/settings'));

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
                    ? 'bg-brand-50 text-brand-700 border border-brand-200/60 shadow-xs'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-surface-border shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-ink-muted truncate">{currentUser?.email}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign out"
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
