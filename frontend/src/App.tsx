// src/App.tsx
import React from 'react';
import { PartnerProvider, usePartner } from './lib/store';
import { ToastContainer } from './components/ui/ToastContainer';
import { PortalSwitcherHub } from './components/layout/PortalSwitcherHub';
import { PortalAccessDenied } from './components/layout/PortalAccessDenied';

// Public & Auth Pages
import { MarketingLandingPage } from './components/auth/MarketingLandingPage';
import { UserLoginPage } from './components/auth/UserLoginPage';
import { AgencyLoginPage } from './components/auth/AgencyLoginPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { UserSignupPage } from './components/auth/UserSignupPage';
import { AgencySignupPage } from './components/auth/AgencySignupPage';
import { PricingPage } from './components/auth/PricingPage';

// Single User Panel Components
import { UserLayout } from './components/user/UserLayout';
import { UserOnboardingPage } from './components/user/UserOnboardingPage';

// Agency Partner Panel Components
import { AgencyLayout } from './components/agency/AgencyLayout';
import { AgencyOnboardingPage } from './components/agency/AgencyOnboardingPage';

// Super Admin Panel Components
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';

// Shared Feature Modules (scoped within the layouts)
import { DashboardPage } from './components/dashboard/DashboardPage';
import { PostsPage } from './components/posts/PostsPage';
import { ReviewsPage } from './components/reviews/ReviewsPage';
import { PhotosPage } from './components/photos/PhotosPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ClientsPage } from './components/agency/ClientsPage';

const AppContent: React.FC = () => {
  const { currentPath, activeRole, isAuthenticated } = usePartner();

  // -------------------------------------------------------------
  // 1. PUBLIC MARKETING & AUTH ROUTES (No shell layout)
  // -------------------------------------------------------------
  if (currentPath === '/') {
    return <MarketingLandingPage />;
  }

  if (currentPath === '/pricing') {
    return <PricingPage />;
  }

  if (currentPath === '/login/user') {
    return <UserLoginPage />;
  }

  if (currentPath === '/login/agency') {
    return <AgencyLoginPage />;
  }

  if (currentPath === '/login/admin') {
    return <AdminLoginPage />;
  }

  if (currentPath === '/signup/user') {
    return <UserSignupPage />;
  }

  if (currentPath === '/signup/agency') {
    return <AgencySignupPage />;
  }

  // -------------------------------------------------------------
  // 2. PANEL 1: SINGLE BUSINESS USER ROUTES (/user/*)
  // -------------------------------------------------------------
  if (currentPath.startsWith('/user')) {
    // Auth Guard
    if (!isAuthenticated) {
      return <UserLoginPage />;
    }

    // Strict Role Isolation Guard
    if (activeRole !== 'single' && activeRole !== 'super_admin') {
      return <PortalAccessDenied requiredRole="single" />;
    }

    // Onboarding flow (standalone)
    if (currentPath === '/user/onboarding') {
      return <UserOnboardingPage />;
    }

    // Single User Application Shell Layout
    return (
      <UserLayout>
        {(() => {
          if (currentPath === '/user/posts' || currentPath === '/user/posts/new') {
            return <PostsPage />;
          }
          if (currentPath === '/user/reviews') {
            return <ReviewsPage />;
          }
          if (currentPath === '/user/photos') {
            return <PhotosPage />;
          }
          if (currentPath.startsWith('/user/settings')) {
            const tab = currentPath.split('/')[3] || 'profile';
            return <SettingsPage initialTab={tab} />;
          }
          // Default: /user/dashboard
          return <DashboardPage />;
        })()}
      </UserLayout>
    );
  }

  // -------------------------------------------------------------
  // 3. PANEL 2: AGENCY PARTNER ROUTES (/agency/*)
  // -------------------------------------------------------------
  if (currentPath.startsWith('/agency')) {
    // Auth Guard
    if (!isAuthenticated) {
      return <AgencyLoginPage />;
    }

    // Strict Role Isolation Guard
    if (activeRole !== 'agency' && activeRole !== 'super_admin') {
      return <PortalAccessDenied requiredRole="agency" />;
    }

    // Onboarding flow (standalone)
    if (currentPath === '/agency/onboarding') {
      return <AgencyOnboardingPage />;
    }

    // Agency Application Shell Layout (Includes Client Switcher)
    return (
      <AgencyLayout>
        {(() => {
          if (currentPath === '/agency/clients') {
            return <ClientsPage />;
          }
          if (currentPath === '/agency/posts' || currentPath === '/agency/posts/new') {
            return <PostsPage />;
          }
          if (currentPath === '/agency/reviews') {
            return <ReviewsPage />;
          }
          if (currentPath === '/agency/photos') {
            return <PhotosPage />;
          }
          if (currentPath === '/agency/team') {
            return <SettingsPage initialTab="team" />;
          }
          if (currentPath.startsWith('/agency/settings')) {
            const tab = currentPath.split('/')[3] || 'profile';
            return <SettingsPage initialTab={tab} />;
          }
          // Default: /agency/dashboard (shows cross-client aggregation & comparison)
          return <DashboardPage />;
        })()}
      </AgencyLayout>
    );
  }

  // -------------------------------------------------------------
  // 4. PANEL 3: SUPER ADMIN OPERATIONS CENTER (/admin/*)
  // -------------------------------------------------------------
  if (currentPath.startsWith('/admin')) {
    // Auth Guard
    if (!isAuthenticated) {
      return <AdminLoginPage />;
    }

    // Strict Role Isolation Guard
    if (activeRole !== 'super_admin') {
      return <PortalAccessDenied requiredRole="super_admin" />;
    }

    // Admin Application Shell Layout (Anthropic dark/slate UI)
    return (
      <AdminLayout>
        {(() => {
          if (currentPath === '/admin/users') {
            return <AdminDashboardPage initialTab="users" />;
          }
          if (currentPath === '/admin/agencies') {
            return <AdminDashboardPage initialTab="agencies" />;
          }
          if (currentPath === '/admin/pricing') {
            return <AdminDashboardPage initialTab="plans" />;
          }
          if (currentPath === '/admin/settings') {
            return <AdminDashboardPage initialTab="system" />;
          }
          // Default: /admin or /admin/dashboard
          return <AdminDashboardPage initialTab="overview" />;
        })()}
      </AdminLayout>
    );
  }

  // -------------------------------------------------------------
  // 5. BACKWARD COMPATIBILITY / FALLBACK (/app/* -> Role Panel)
  // -------------------------------------------------------------
  if (currentPath.startsWith('/app')) {
    if (!isAuthenticated) {
      return <MarketingLandingPage />;
    }
    if (activeRole === 'single') {
      return (
        <UserLayout>
          <DashboardPage />
        </UserLayout>
      );
    }
    if (activeRole === 'agency') {
      return (
        <AgencyLayout>
          <DashboardPage />
        </AgencyLayout>
      );
    }
    return (
      <AdminLayout>
        <AdminDashboardPage initialTab="overview" />
      </AdminLayout>
    );
  }

  // Final fallback to Landing Page
  return <MarketingLandingPage />;
};

export default function App() {
  return (
    <PartnerProvider>
      <AppContent />
      {/* Universal feedback notifications */}
      <ToastContainer />
      {/* Floating Demo Role & Portal Switcher for fast evaluation */}
      <PortalSwitcherHub />
    </PartnerProvider>
  );
}
