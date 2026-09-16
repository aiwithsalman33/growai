// src/lib/store.tsx - Global state for Partner.ai.
//
// Business data lives in Postgres and reaches this file through `lib/api`.
// localStorage is used only for non-sensitive UI state (the current path);
// the session itself is an in-memory access token plus an httpOnly refresh
// cookie, so closing the tab does not leave credentials on disk.
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  User,
  UserRole,
  GbpAccount,
  GbpPost,
  GbpReview,
  AiReplyConfig,
  GbpPhoto,
  PricingPlan,
  AgencyTeamMember,
  GlobalPlatformSettings,
  KpiSummary,
} from '../types';
import {
  ApiError,
  AiUsageSummary,
  TrendPoint,
  aiUsageApi,
  authApi,
  gbpApi,
  postsApi,
  reviewsApi,
  photosApi,
  kpisApi,
  agencyApi,
  billingApi,
  adminApi,
  setAccessToken,
  setUnauthenticatedHandler,
} from './api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface PartnerContextType {
  // Current session & role
  currentUser: User;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isBooting: boolean;
  setActiveRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole) => void;
  login: (
    expectedRole: UserRole,
    email: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    role: 'single' | 'agency',
    name: string,
    email: string,
    companyName: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Active GBP account (for Single / Agency client scoping)
  activeGbpAccountId: string;
  setActiveGbpAccountId: (id: string) => void;
  activeGbpAccount: GbpAccount | undefined;
  userGbpAccounts: GbpAccount[];
  allGbpAccounts: GbpAccount[];
  // Alias for allGbpAccounts. Three settings components already read this name;
  // it was never on the context before, so it silently resolved to undefined.
  gbpAccounts: GbpAccount[];

  // Navigation / Routing
  currentPath: string;
  navigate: (path: string) => void;

  // Data collections & Mutators
  posts: GbpPost[];
  createPost: (post: Omit<GbpPost, 'id'>) => Promise<GbpPost>;
  updatePost: (id: string, updates: Partial<GbpPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  duplicatePost: (id: string) => Promise<void>;
  reschedulePost: (id: string, newDate: string) => Promise<void>;

  reviews: GbpReview[];
  replyToReview: (
    id: string,
    replyText: string,
    replySource: 'manual' | 'ai'
  ) => Promise<void>;
  generateAiReply: (review: GbpReview, customTone?: string) => Promise<string>;
  syncReviews: () => Promise<void>;

  aiConfigs: Record<string, AiReplyConfig>;
  updateAiConfig: (accountId: string, updates: Partial<AiReplyConfig>) => Promise<void>;

  photos: GbpPhoto[];
  uploadPhoto: (
    photo: Omit<GbpPhoto, 'id' | 'uploadedAt' | 'viewsCount'>,
    file?: File
  ) => Promise<GbpPhoto>;
  deletePhoto: (id: string) => Promise<void>;

  pricingPlans: PricingPlan[];
  updatePricingPlan: (id: string, updates: Partial<PricingPlan>) => Promise<void>;

  teamMembers: AgencyTeamMember[];
  inviteTeamMember: (
    name: string,
    email: string,
    role: 'admin' | 'manager' | 'contributor'
  ) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;

  globalSettings: GlobalPlatformSettings;
  updateGlobalSettings: (updates: Partial<GlobalPlatformSettings>) => Promise<void>;

  addGbpAccount: (
    account: Omit<GbpAccount, 'id' | 'connected' | 'connectedAt'>
  ) => Promise<GbpAccount>;
  updateGbpAccount: (id: string, updates: Partial<GbpAccount>) => Promise<void>;
  disconnectGbpAccount: (id: string) => Promise<void>;
  connectGbpAccount: (id: string) => Promise<void>;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  upgradeUserPlan: (newPlanId: string) => Promise<void>;
  allUsers: User[];
  adminPlatformStats: {
    mrr: number;
    totalUsers: number;
    singleUsers: number;
    agencyUsers: number;
    totalGbpLocations: number;
    churnRate: number;
    totalTokensMonth: number;
    googleApiQuotaUsed: number;
  };
  impersonateUser: (userId: string) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Utilities
  resetToDefaults: () => void;
  refreshData: () => Promise<void>;
  getKpisForAccount: (accountId: string, period: '7d' | '30d' | '90d') => KpiSummary;
  /** Trend-chart points for the active account. Synchronous like the KPI
   *  getter, because the chart reads it during render. */
  getTrendSeries: (period: '7d' | '30d' | '90d') => {
    series: TrendPoint[];
    loading: boolean;
    engagementAvailable: boolean;
  };
  aiUsage: AiUsageSummary | null;
  refreshAiUsage: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | null>(null);

const STORAGE_PREFIX = 'partner_ai_v3_';

/** Keeps `currentUser` non-null before a session is restored. */
const GUEST_USER: User = {
  id: '',
  name: 'Guest',
  email: '',
  role: 'single',
  planId: '',
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: GlobalPlatformSettings = {
  defaultLlmProvider: 'anthropic',
  defaultModel: 'claude-opus-5',
  maintenanceMode: false,
  globalAnnouncement: '',
  systemPromptPreset: '',
  apiRateLimitPerMin: 120,
  gbpSyncIntervalMinutes: 60,
};

const EMPTY_STATS = {
  mrr: 0,
  totalUsers: 0,
  singleUsers: 0,
  agencyUsers: 0,
  totalGbpLocations: 0,
  churnRate: 0,
  totalTokensMonth: 0,
  googleApiQuotaUsed: 0,
};

function zeroKpis(accountId: string): KpiSummary {
  return {
    gbpAccountId: accountId,
    rangeStart: '',
    rangeEnd: '',
    views: 0,
    searches: 0,
    calls: 0,
    directionRequests: 0,
    websiteClicks: 0,
    avgRating: 0,
    reviewCount: 0,
    postCount: 0,
    viewsTrend: 0,
    callsTrend: 0,
    directionsTrend: 0,
    clicksTrend: 0,
  };
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.details?.length ? `${err.message}: ${err.details[0]}` : err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

const LANDING_FOR_ROLE: Record<UserRole, string> = {
  single: '/user/dashboard',
  agency: '/agency/dashboard',
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
};

const LOGIN_FOR_ROLE: Record<UserRole, string> = {
  single: '/login/user',
  agency: '/login/agency',
  super_admin: '/login/admin',
  admin: '/login/admin',
};

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [activeRole, setActiveRoleState] = useState<UserRole>('single');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBooting, setIsBooting] = useState(true);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}path`) || '/';
    } catch {
      return '/';
    }
  });

  const [gbpAccounts, setGbpAccounts] = useState<GbpAccount[]>([]);
  const [activeGbpAccountId, setActiveGbpAccountIdState] = useState<string>('');
  const [posts, setPosts] = useState<GbpPost[]>([]);
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [aiConfigs, setAiConfigs] = useState<Record<string, AiReplyConfig>>({});
  const [photos, setPhotos] = useState<GbpPhoto[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [teamMembers, setTeamMembers] = useState<AgencyTeamMember[]>([]);
  const [globalSettings, setGlobalSettings] =
    useState<GlobalPlatformSettings>(DEFAULT_SETTINGS);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminPlatformStats, setAdminPlatformStats] = useState(EMPTY_STATS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // KPI cache, keyed `accountId:period`. Lets getKpisForAccount stay
  // synchronous for the components that call it during render.
  const [kpiCache, setKpiCache] = useState<Record<string, KpiSummary>>({});
  const kpiRequests = useRef<Set<string>>(new Set());

  // Same cache-on-miss shape as the KPI getter.
  const [trendCache, setTrendCache] = useState<
    Record<string, { series: TrendPoint[]; engagementAvailable: boolean }>
  >({});
  const trendRequests = useRef<Set<string>>(new Set());
  const [aiUsage, setAiUsage] = useState<AiUsageSummary | null>(null);

  // -------------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------------

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastError = useCallback(
    (title: string, err: unknown) => {
      addToast({ type: 'error', title, description: errorMessage(err) });
    },
    [addToast]
  );

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}path`, currentPath);
    } catch {
      // Private browsing — losing the last path is harmless.
    }
  }, [currentPath]);

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------

  const applySession = useCallback((user: User) => {
    setCurrentUser(user);
    setActiveRoleState(user.role);
    setIsAuthenticated(true);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    setGbpAccounts([]);
    setActiveGbpAccountIdState('');
    setPosts([]);
    setReviews([]);
    setPhotos([]);
    setAiConfigs({});
    setTeamMembers([]);
    setAllUsers([]);
    setAdminPlatformStats(EMPTY_STATS);
    setKpiCache({});
    setTrendCache({});
    setAiUsage(null);
  }, []);

  // A refresh failure anywhere in the app lands here.
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      clearSession();
      setCurrentPath((path) =>
        path.startsWith('/user')
          ? '/login/user'
          : path.startsWith('/agency')
            ? '/login/agency'
            : path.startsWith('/admin')
              ? '/login/admin'
              : path
      );
    });
    return () => setUnauthenticatedHandler(null);
  }, [clearSession]);

  // Restore the session from the refresh cookie on first paint.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await authApi.restore();
        if (!cancelled && user) applySession(user);
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // Pricing is public — the marketing and pricing pages need it signed out.
  useEffect(() => {
    billingApi
      .getPlans()
      .then(setPricingPlans)
      .catch(() => setPricingPlans([]));
  }, []);

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadTenantData = useCallback(async () => {
    const accounts = await gbpApi.getAccounts();
    setGbpAccounts(accounts);
    setActiveGbpAccountIdState((current) =>
      current && accounts.some((a) => a.id === current)
        ? current
        : accounts[0]?.id || ''
    );
  }, []);

  const loadAdminData = useCallback(async () => {
    const [users, stats, plans, settings] = await Promise.all([
      adminApi.listUsers().catch(() => []),
      adminApi.getPlatformKpis().catch(() => ({})),
      adminApi.listPlans().catch(() => []),
      adminApi.getSettings().catch(() => null),
    ]);
    setAllUsers(users);
    setAdminPlatformStats({ ...EMPTY_STATS, ...stats });
    if (plans.length) setPricingPlans(plans);
    if (settings) setGlobalSettings({ ...DEFAULT_SETTINGS, ...settings });
  }, []);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      if (activeRole === 'super_admin') {
        await Promise.all([loadAdminData(), loadTenantData()]);
      } else {
        await loadTenantData();
        if (activeRole === 'agency') {
          setTeamMembers(await agencyApi.listTeam().catch(() => []));
        }
      }
    } catch (err) {
      toastError('Could not load your data', err);
    }
  }, [isAuthenticated, activeRole, loadTenantData, loadAdminData, toastError]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Per-account collections reload whenever the active client changes.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      const scope = activeGbpAccountId || undefined;
      try {
        const [nextPosts, nextReviews, nextPhotos] = await Promise.all([
          postsApi.list(scope),
          reviewsApi.list(scope),
          photosApi.list(scope),
        ]);
        if (cancelled) return;
        setPosts(nextPosts);
        setReviews(nextReviews);
        setPhotos(nextPhotos);
      } catch (err) {
        if (!cancelled) toastError('Could not load profile content', err);
      }

      if (!scope || cancelled) return;
      try {
        const config = await gbpApi.getAiConfig(scope);
        if (!cancelled) setAiConfigs((prev) => ({ ...prev, [scope]: config }));
      } catch {
        // An account with no saved config yet is normal.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeGbpAccountId, toastError]);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const userGbpAccounts = gbpAccounts.filter(
    (acc) => activeRole === 'super_admin' || acc.ownerUserId === currentUser.id
  );

  const activeGbpAccount =
    gbpAccounts.find((a) => a.id === activeGbpAccountId) || userGbpAccounts[0];

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  const login = async (
    expectedRole: UserRole,
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const user = await authApi.login(expectedRole, email.trim().toLowerCase(), password);
      applySession(user);
      setCurrentPath(LANDING_FOR_ROLE[user.role]);
      addToast({
        type: 'success',
        title: `Welcome back, ${user.name}!`,
        description: `Signed in to the ${
          user.role === 'single'
            ? 'Single User'
            : user.role === 'agency'
              ? 'Agency'
              : 'Super Admin'
        } panel.`,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err) };
    }
  };

  const signup = async (
    role: 'single' | 'agency',
    name: string,
    email: string,
    companyName: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!password || password.length < 8) {
      return { success: false, error: 'Please choose a password of at least 8 characters.' };
    }

    try {
      const user = await authApi.signup(role, {
        name,
        email: email.trim().toLowerCase(),
        password,
        companyName,
      });
      applySession(user);
      setCurrentPath(role === 'single' ? '/user/onboarding' : '/agency/onboarding');
      addToast({
        type: 'success',
        title: 'Account created successfully!',
        description: "Welcome to Partner.ai. Let's connect your Google Business Profile.",
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: errorMessage(err) };
    }
  };

  const logout = () => {
    const prevRole = activeRole;
    void authApi.logout().catch(() => undefined);
    clearSession();
    setCurrentPath(LOGIN_FOR_ROLE[prevRole] || '/');
    addToast({
      type: 'info',
      title: 'Signed out',
      description: 'You have been safely signed out.',
    });
  };

  /**
   * Portal switcher. Roles are now real: only a super admin may walk into
   * another portal. Anyone else is sent to that portal's login screen rather
   * than being silently handed a different identity.
   */
  const switchUserRole = useCallback(
    (newRole: UserRole) => {
      if (currentUser.role === 'super_admin' && isAuthenticated) {
        setActiveRoleState(newRole);
        setCurrentPath(LANDING_FOR_ROLE[newRole]);
        addToast({
          type: 'info',
          title: `Viewing the ${newRole.replace('_', ' ')} portal`,
          description: 'Super admin access — actions are recorded in the audit log.',
        });
        return;
      }

      setCurrentPath(LOGIN_FOR_ROLE[newRole]);
      addToast({
        type: 'info',
        title: 'Sign in required',
        description: `Each portal has its own credentials. Sign in to continue.`,
      });
    },
    [currentUser.role, isAuthenticated, addToast]
  );

  const setActiveGbpAccountId = useCallback(
    (id: string) => {
      setActiveGbpAccountIdState(id);
      const target = gbpAccounts.find((a) => a.id === id);
      if (target) {
        addToast({
          type: 'info',
          title: `Switched location: ${target.clientLabel || target.locationName}`,
          description: 'Dashboard metrics, posts, and reviews refreshed for this profile.',
        });
      }
    },
    [gbpAccounts, addToast]
  );

  const impersonateUser = useCallback(
    (userId: string) => {
      void (async () => {
        try {
          const target = await adminApi.impersonate(userId);
          applySession(target);
          setActiveGbpAccountIdState('');
          setCurrentPath(LANDING_FOR_ROLE[target.role]);
          addToast({
            type: 'info',
            title: `Impersonating ${target.name}`,
            description: `Acting with ${target.role.toUpperCase()} tenant context.`,
          });
        } catch (err) {
          toastError('Could not impersonate that user', err);
        }
      })();
    },
    [applySession, addToast, toastError]
  );

  // -------------------------------------------------------------------------
  // Posts
  // -------------------------------------------------------------------------

  const createPost = async (newPostData: Omit<GbpPost, 'id'>): Promise<GbpPost> => {
    try {
      const post = await postsApi.create({
        ...newPostData,
        gbpAccountId: newPostData.gbpAccountId || activeGbpAccountId,
      });
      setPosts((prev) => [post, ...prev]);
      addToast({
        type: 'success',
        title:
          post.status === 'SCHEDULED'
            ? 'Post scheduled successfully'
            : post.status === 'PUBLISHED'
              ? 'Post published to Google Profile'
              : 'Draft saved',
        description: `Targeting: ${activeGbpAccount?.locationName || 'your profile'}`,
      });
      return post;
    } catch (err) {
      toastError('Could not save the post', err);
      throw err;
    }
  };

  const updatePost = async (id: string, updates: Partial<GbpPost>) => {
    try {
      const post = await postsApi.update(id, updates);
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
      addToast({ type: 'success', title: 'Post updated' });
    } catch (err) {
      toastError('Could not update the post', err);
    }
  };

  const deletePost = async (id: string) => {
    try {
      await postsApi.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      addToast({ type: 'info', title: 'Post deleted' });
    } catch (err) {
      toastError('Could not delete the post', err);
    }
  };

  const duplicatePost = async (id: string) => {
    try {
      const post = await postsApi.duplicate(id);
      setPosts((prev) => [post, ...prev]);
      addToast({
        type: 'success',
        title: 'Post duplicated',
        description: 'Created a new draft from the selected post.',
      });
    } catch (err) {
      toastError('Could not duplicate the post', err);
    }
  };

  const reschedulePost = async (id: string, newDate: string) => {
    try {
      const post = await postsApi.reschedule(id, newDate);
      setPosts((prev) => prev.map((p) => (p.id === id ? post : p)));
      addToast({
        type: 'success',
        title: 'Post rescheduled',
        description: `New schedule: ${new Date(newDate).toLocaleString()}`,
      });
    } catch (err) {
      toastError('Could not reschedule the post', err);
    }
  };

  // -------------------------------------------------------------------------
  // Reviews
  // -------------------------------------------------------------------------

  const replyToReview = async (
    id: string,
    replyText: string,
    replySource: 'manual' | 'ai'
  ) => {
    try {
      const review = await reviewsApi.sendReply(id, replyText, replySource);
      setReviews((prev) => prev.map((r) => (r.id === id ? review : r)));
      addToast({
        type: 'success',
        title: replySource === 'ai' ? 'AI reply sent to Google' : 'Reply posted to Google',
        description: 'The response is now live on Google Maps & Search.',
      });
    } catch (err) {
      toastError('Could not post the reply', err);
    }
  };

  const generateAiReply = async (
    review: GbpReview,
    customTone?: string
  ): Promise<string> => {
    try {
      return await reviewsApi.generateAiReply(review.id, { tone: customTone });
    } catch (err) {
      toastError('Could not generate a reply', err);
      throw err;
    }
  };

  const syncReviews = async () => {
    if (!activeGbpAccountId) return;
    try {
      const result = await reviewsApi.sync(activeGbpAccountId);
      setReviews(await reviewsApi.list(activeGbpAccountId));
      addToast({
        type: 'success',
        title: 'Reviews synced',
        description: `${result.created} new, ${result.updated} updated.`,
      });
    } catch (err) {
      toastError('Could not sync reviews', err);
    }
  };

  const updateAiConfig = async (accountId: string, updates: Partial<AiReplyConfig>) => {
    try {
      const config = await gbpApi.updateAiConfig(accountId, updates);
      setAiConfigs((prev) => ({ ...prev, [accountId]: config }));
      addToast({
        type: 'success',
        title: 'AI persona & settings saved',
        description: 'New guidelines will shape all future generated replies.',
      });
    } catch (err) {
      toastError('Could not save the AI settings', err);
    }
  };

  // -------------------------------------------------------------------------
  // Photos
  // -------------------------------------------------------------------------

  const uploadPhoto = async (
    photoData: Omit<GbpPhoto, 'id' | 'uploadedAt' | 'viewsCount'>,
    file?: File
  ): Promise<GbpPhoto> => {
    try {
      const form = new FormData();
      form.append('gbpAccountId', photoData.gbpAccountId || activeGbpAccountId);
      form.append('category', photoData.category);
      if (photoData.caption) form.append('caption', photoData.caption);
      if (file) form.append('file', file);

      const photo = await photosApi.upload(form);
      setPhotos((prev) => [photo, ...prev]);
      addToast({
        type: 'success',
        title: 'Photo uploaded',
        description: `Category: ${photo.category} • ${activeGbpAccount?.locationName || ''}`,
      });
      return photo;
    } catch (err) {
      toastError('Could not upload the photo', err);
      throw err;
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await photosApi.delete(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      addToast({ type: 'info', title: 'Photo removed' });
    } catch (err) {
      toastError('Could not delete the photo', err);
    }
  };

  // -------------------------------------------------------------------------
  // Plans, team, settings
  // -------------------------------------------------------------------------

  const updatePricingPlan = async (id: string, updates: Partial<PricingPlan>) => {
    try {
      const plan = await adminApi.updatePlan(id, updates);
      setPricingPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
      addToast({
        type: 'success',
        title: 'Pricing plan updated',
        description: 'New pricing and limits are now active platform-wide.',
      });
    } catch (err) {
      toastError('Could not update the plan', err);
    }
  };

  const inviteTeamMember = async (
    name: string,
    email: string,
    role: 'admin' | 'manager' | 'contributor'
  ) => {
    try {
      const member = await agencyApi.inviteMember(name, email, role);
      setTeamMembers((prev) => [...prev, member]);
      addToast({
        type: 'success',
        title: `Invitation sent to ${email}`,
        description: `Role assigned: ${role.toUpperCase()}`,
      });
    } catch (err) {
      toastError('Could not invite that team member', err);
    }
  };

  const removeTeamMember = async (id: string) => {
    try {
      await agencyApi.removeMember(id);
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
      addToast({
        type: 'info',
        title: 'Team member removed',
        description: 'Access revoked from agency client profiles.',
      });
    } catch (err) {
      toastError('Could not remove that team member', err);
    }
  };

  const updateGlobalSettings = async (updates: Partial<GlobalPlatformSettings>) => {
    try {
      const settings = await adminApi.updateSettings(updates);
      setGlobalSettings({ ...DEFAULT_SETTINGS, ...settings });
      addToast({ type: 'success', title: 'Global platform settings saved' });
    } catch (err) {
      toastError('Could not save the settings', err);
    }
  };

  // -------------------------------------------------------------------------
  // GBP accounts
  // -------------------------------------------------------------------------

  const addGbpAccount = async (
    accountData: Omit<GbpAccount, 'id' | 'connected' | 'connectedAt'>
  ): Promise<GbpAccount> => {
    try {
      const account = await gbpApi.create(accountData);
      setGbpAccounts((prev) => [...prev, account]);
      setActiveGbpAccountIdState(account.id);
      addToast({
        type: 'success',
        title: 'Location added',
        description: `Connect ${account.locationName} to Google to start syncing.`,
      });
      return account;
    } catch (err) {
      toastError('Could not add that location', err);
      throw err;
    }
  };

  /** Hands the browser to Google's consent screen. */
  const connectGbpAccount = async (id: string) => {
    try {
      const url = await gbpApi.startOAuth(id);
      window.location.href = url;
    } catch (err) {
      toastError('Could not start Google authorization', err);
    }
  };

  const updateGbpAccount = async (id: string, updates: Partial<GbpAccount>) => {
    try {
      const account = await gbpApi.update(id, updates);
      setGbpAccounts((prev) => prev.map((a) => (a.id === id ? account : a)));
      addToast({
        type: 'success',
        title: 'Profile details saved',
        description: 'Google Business Profile details have been updated.',
      });
    } catch (err) {
      toastError('Could not save the profile', err);
    }
  };

  const disconnectGbpAccount = async (id: string) => {
    try {
      const account = await gbpApi.disconnect(id);
      setGbpAccounts((prev) => prev.map((a) => (a.id === id ? account : a)));
      addToast({
        type: 'warning',
        title: 'Google account disconnected',
        description: 'Stored tokens were deleted and the location unlinked.',
      });
    } catch (err) {
      toastError('Could not disconnect that account', err);
    }
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    try {
      const user = await authApi.updateProfile(updates);
      setCurrentUser(user);
      addToast({ type: 'success', title: 'Personal profile updated' });
    } catch (err) {
      toastError('Could not update your profile', err);
    }
  };

  const upgradeUserPlan = async (newPlanId: string) => {
    try {
      const user = await billingApi.updateSubscription(newPlanId);
      setCurrentUser(user);
      const planName = pricingPlans.find((p) => p.id === newPlanId)?.name || newPlanId;
      addToast({
        type: 'success',
        title: `Switched to ${planName}`,
        description: 'Your new account quotas and features are active immediately.',
      });
    } catch (err) {
      toastError('Could not change your plan', err);
    }
  };

  // -------------------------------------------------------------------------
  // KPIs — synchronous read, asynchronous fill
  // -------------------------------------------------------------------------

  const getKpisForAccount = useCallback(
    (accountId: string, period: '7d' | '30d' | '90d'): KpiSummary => {
      const key = `${accountId || 'all'}:${period}`;
      const cached = kpiCache[key];
      if (cached) return cached;

      if (isAuthenticated && !kpiRequests.current.has(key)) {
        kpiRequests.current.add(key);
        kpisApi
          .summary(accountId || 'all', period)
          .then((kpis) => setKpiCache((prev) => ({ ...prev, [key]: kpis })))
          .catch(() => undefined)
          .finally(() => kpiRequests.current.delete(key));
      }

      // Zeros until the real numbers land — never invented figures.
      return zeroKpis(accountId);
    },
    [kpiCache, isAuthenticated]
  );

  const getTrendSeries = useCallback(
    (period: '7d' | '30d' | '90d') => {
      const key = `${activeGbpAccountId || 'all'}:${period}`;
      const cached = trendCache[key];

      if (!cached && isAuthenticated && !trendRequests.current.has(key)) {
        trendRequests.current.add(key);
        kpisApi
          .timeseries(activeGbpAccountId || 'all', period)
          .then((result) =>
            setTrendCache((prev) => ({
              ...prev,
              [key]: {
                series: result.series,
                engagementAvailable: result.engagementAvailable,
              },
            }))
          )
          .catch(() => undefined)
          .finally(() => trendRequests.current.delete(key));
      }

      return {
        series: cached?.series || [],
        loading: !cached && isAuthenticated,
        engagementAvailable: cached?.engagementAvailable ?? false,
      };
    },
    [trendCache, activeGbpAccountId, isAuthenticated]
  );

  const refreshAiUsage = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setAiUsage(await aiUsageApi.summary());
    } catch {
      // The panel renders an empty state rather than failing the page.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshAiUsage();
  }, [refreshAiUsage, reviews.length]);

  // Metrics are scoped to the account and the data underneath them.
  useEffect(() => {
    setKpiCache({});
    kpiRequests.current.clear();
    setTrendCache({});
    trendRequests.current.clear();
  }, [activeGbpAccountId, posts.length, reviews.length]);

  // -------------------------------------------------------------------------
  // Dev utility
  // -------------------------------------------------------------------------

  const resetToDefaults = useCallback(() => {
    void (async () => {
      try {
        await adminApi.reseed();
        await refreshData();
        addToast({
          type: 'info',
          title: 'Demo data restored',
          description: 'Seed users, plans and locations were re-created.',
        });
      } catch (err) {
        toastError('Could not reset the demo data', err);
      }
    })();
  }, [refreshData, addToast, toastError]);

  return (
    <PartnerContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
        isBooting,
        setActiveRole: setActiveRoleState,
        switchUserRole,
        login,
        signup,
        logout,
        activeGbpAccountId,
        setActiveGbpAccountId,
        activeGbpAccount,
        userGbpAccounts,
        allGbpAccounts: gbpAccounts,
        gbpAccounts,
        currentPath,
        navigate,
        posts,
        createPost,
        updatePost,
        deletePost,
        duplicatePost,
        reschedulePost,
        reviews,
        replyToReview,
        generateAiReply,
        syncReviews,
        aiConfigs,
        updateAiConfig,
        photos,
        uploadPhoto,
        deletePhoto,
        pricingPlans,
        updatePricingPlan,
        teamMembers,
        inviteTeamMember,
        removeTeamMember,
        globalSettings,
        updateGlobalSettings,
        addGbpAccount,
        updateGbpAccount,
        disconnectGbpAccount,
        connectGbpAccount,
        updateCurrentUser,
        upgradeUserPlan,
        allUsers,
        adminPlatformStats,
        impersonateUser,
        toasts,
        addToast,
        removeToast,
        resetToDefaults,
        refreshData,
        getKpisForAccount,
        getTrendSeries,
        aiUsage,
        refreshAiUsage,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = (): PartnerContextType => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};
