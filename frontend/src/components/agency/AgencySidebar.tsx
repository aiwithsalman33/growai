// src/components/agency/AgencySidebar.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Users,
  Settings,
  PlusCircle,
  ChevronDown,
  Sparkles,
  LogOut,
  Check,
  Search
} from 'lucide-react';

interface AgencySidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AgencySidebar: React.FC<AgencySidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    currentPath,
    navigate,
    logout,
    currentUser,
    userGbpAccounts,
    activeGbpAccountId,
    setActiveGbpAccountId,
    activeGbpAccount
  } = usePartner();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = userGbpAccounts.filter((acc) =>
    (acc.clientLabel || acc.locationName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { label: 'Agency Dashboard', path: '/agency/dashboard', icon: LayoutDashboard },
    { label: 'Client Profiles', path: '/agency/clients', icon: Building2 },
    { label: 'Client Posts', path: '/agency/posts', icon: Calendar },
    { label: 'Client Reviews & AI', path: '/agency/reviews', icon: MessageSquare },
    { label: 'Client Photos', path: '/agency/photos', icon: ImageIcon },
    { label: 'Agency Team', path: '/agency/team', icon: Users },
    { label: 'Agency Settings', path: '/agency/settings/profile', icon: Settings },
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
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-ink">
                Partner<span className="text-brand-600">.ai</span>
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-wider text-brand-700">
                Agency Partner Panel
              </span>
            </div>
          </div>
        </div>

        {/* CLIENT SWITCHER (Prominent in Agency Sidebar) */}
        <div className="p-3 border-b border-surface-border bg-surface-muted/60 relative">
          <div className="text-[10px] uppercase font-bold text-ink-muted tracking-wider mb-1.5 flex items-center justify-between">
            <span>Scoped Client Profile</span>
            <span className="text-[9px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
              {userGbpAccounts.length} clients
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-between p-2.5 bg-white rounded-xl border border-surface-border hover:border-brand-500 transition-all shadow-xs text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 font-bold text-xs">
                {activeGbpAccount?.clientLabel?.[0] || activeGbpAccount?.locationName?.[0] || 'C'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">
                  {activeGbpAccount?.clientLabel || activeGbpAccount?.locationName}
                </div>
                <div className="text-[10px] text-ink-muted truncate">
                  {activeGbpAccount?.category || 'GBP Client'}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Switcher Dropdown */}
          {switcherOpen && (
            <div className="absolute left-3 right-3 top-[76px] z-50 bg-white border border-surface-border rounded-xl shadow-xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2 border-b border-surface-border">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search client accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto py-1">
                {filteredAccounts.map((acc) => {
                  const isSelected = acc.id === activeGbpAccountId;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setActiveGbpAccountId(acc.id);
                        setSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-brand-50 transition-colors ${
                        isSelected ? 'bg-brand-50/70 font-bold text-brand-800' : 'text-ink'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div>{acc.clientLabel || acc.locationName}</div>
                        <div className="text-[10px] text-ink-muted font-normal">{acc.locationName}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-surface-border bg-surface-muted">
                <button
                  type="button"
                  onClick={() => {
                    setSwitcherOpen(false);
                    navigate('/agency/clients');
                  }}
                  className="w-full py-1.5 text-[11px] font-bold text-brand-700 hover:text-brand-800 flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Manage / Add Client Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath.startsWith(item.path) ||
              (item.path.startsWith('/agency/settings') && currentPath.startsWith('/agency/settings'));

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

        {/* Agency Footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-full object-cover border border-surface-border shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-ink truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-brand-700 font-semibold truncate">
                  {currentUser?.companyName || 'PeakScale Agency'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign out of Agency"
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
