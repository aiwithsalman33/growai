// src/components/agency/AgencyLayout.tsx
import React, { useState } from 'react';
import { AgencySidebar } from './AgencySidebar';
import { AgencyTopbar } from './AgencyTopbar';

interface AgencyLayoutProps {
  children: React.ReactNode;
}

export const AgencyLayout: React.FC<AgencyLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted text-ink font-sans">
      <AgencySidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AgencyTopbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
