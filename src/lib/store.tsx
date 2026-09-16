// src/lib/store.tsx - Global State and Reactive Data Provider for Partner.ai
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  KpiSummary
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_GBP_ACCOUNTS,
  INITIAL_AI_CONFIGS,
  INITIAL_POSTS,
  INITIAL_REVIEWS,
  INITIAL_PHOTOS,
  INITIAL_PRICING_PLANS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_GLOBAL_SETTINGS,
} from './mockData';

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
  setActiveRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole) => void;
  login: (expectedRole: UserRole, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (role: 'single' | 'agency', name: string, email: string, companyName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Active GBP account (for Single / Agency client scoping)
  activeGbpAccountId: string;
  setActiveGbpAccountId: (id: string) => void;
  activeGbpAccount: GbpAccount | undefined;
  userGbpAccounts: GbpAccount[];
  allGbpAccounts: GbpAccount[];

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
  replyToReview: (id: string, replyText: string, replySource: 'manual' | 'ai') => Promise<void>;
  generateAiReply: (review: GbpReview, customTone?: string) => Promise<string>;

  aiConfigs: Record<string, AiReplyConfig>;
  updateAiConfig: (accountId: string, updates: Partial<AiReplyConfig>) => Promise<void>;

  photos: GbpPhoto[];
  uploadPhoto: (photo: Omit<GbpPhoto, 'id' | 'uploadedAt' | 'viewsCount'>) => Promise<GbpPhoto>;
  deletePhoto: (id: string) => Promise<void>;

  pricingPlans: PricingPlan[];
  updatePricingPlan: (id: string, updates: Partial<PricingPlan>) => Promise<void>;

  teamMembers: AgencyTeamMember[];
  inviteTeamMember: (name: string, email: string, role: 'admin' | 'manager' | 'contributor') => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;

  globalSettings: GlobalPlatformSettings;
  updateGlobalSettings: (updates: Partial<GlobalPlatformSettings>) => Promise<void>;

  addGbpAccount: (account: Omit<GbpAccount, 'id' | 'connected' | 'connectedAt'>) => Promise<GbpAccount>;
  updateGbpAccount: (id: string, updates: Partial<GbpAccount>) => Promise<void>;
  disconnectGbpAccount: (id: string) => Promise<void>;
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
  getKpisForAccount: (accountId: string, period: '7d' | '30d' | '90d') => KpiSummary;
}

const PartnerContext = createContext<PartnerContextType | null>(null);

const STORAGE_PREFIX = 'partner_ai_v2_';

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state or localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}role`);
    return (saved as UserRole) || 'single';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}auth`);
    return saved ? JSON.parse(saved) : true;
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}path`);
    return saved || '/';
  });

  const [gbpAccounts, setGbpAccounts] = useState<GbpAccount[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}accounts`);
    return saved ? JSON.parse(saved) : INITIAL_GBP_ACCOUNTS;
  });

  const [activeGbpAccountId, setActiveGbpAccountIdState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}active_gbp`);
    return saved || 'gbp-artisan';
  });

  const [posts, setPosts] = useState<GbpPost[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}posts`);
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [reviews, setReviews] = useState<GbpReview[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}reviews`);
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [aiConfigs, setAiConfigs] = useState<Record<string, AiReplyConfig>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}ai_configs`);
    return saved ? JSON.parse(saved) : INITIAL_AI_CONFIGS;
  });

  const [photos, setPhotos] = useState<GbpPhoto[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}photos`);
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}plans`);
    return saved ? JSON.parse(saved) : INITIAL_PRICING_PLANS;
  });

  const [teamMembers, setTeamMembers] = useState<AgencyTeamMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}team`);
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalPlatformSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return saved ? JSON.parse(saved) : INITIAL_GLOBAL_SETTINGS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast dispatchers
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}role`, activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}path`, currentPath);
  }, [currentPath]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(gbpAccounts));
  }, [gbpAccounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}active_gbp`, activeGbpAccountId);
  }, [activeGbpAccountId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}posts`, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}reviews`, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}ai_configs`, JSON.stringify(aiConfigs));
  }, [aiConfigs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}photos`, JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}plans`, JSON.stringify(pricingPlans));
  }, [pricingPlans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}team`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(globalSettings));
  }, [globalSettings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}auth`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Derive current user based on activeRole
  const currentUser = users.find((u) => u.role === activeRole) || users[0];

  // Derive GBP accounts accessible to current user
  const userGbpAccounts = gbpAccounts.filter((acc) => {
    if (activeRole === 'super_admin') return true;
    if (activeRole === 'single') return acc.ownerUserId === 'user-single';
    if (activeRole === 'agency') return acc.ownerUserId === 'user-agency';
    return true;
  });

  // Ensure activeGbpAccountId is valid for current role
  useEffect(() => {
    if (activeRole === 'single') {
      setActiveGbpAccountIdState('gbp-artisan');
    } else if (activeRole === 'agency') {
      if (!userGbpAccounts.some((a) => a.id === activeGbpAccountId)) {
        setActiveGbpAccountIdState(userGbpAccounts[0]?.id || 'gbp-blueharbor');
      }
    }
  }, [activeRole, userGbpAccounts, activeGbpAccountId]);

  const activeGbpAccount = gbpAccounts.find((a) => a.id === activeGbpAccountId) || userGbpAccounts[0];

  const navigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const login = async (
    expectedRole: UserRole,
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!foundUser) {
      return {
        success: false,
        error: `No account found for "${email}". Please verify your email or create an account.`
      };
    }

    if (foundUser.role !== expectedRole) {
      if (foundUser.role === 'single') {
        return {
          success: false,
          error: `This email is registered as a Single Business User. Please sign in via the Single Business Login portal (/login/user).`
        };
      } else if (foundUser.role === 'agency') {
        return {
          success: false,
          error: `This email is registered as an Agency Partner. Please sign in via the Agency Login portal (/login/agency).`
        };
      } else if (foundUser.role === 'super_admin') {
        return {
          success: false,
          error: `This account has Super Admin credentials. Please access via the Super Admin Operations Portal (/login/admin).`
        };
      }
    }

    // Success
    setIsAuthenticated(true);
    setActiveRoleState(foundUser.role);

    if (foundUser.role === 'single') {
      setActiveGbpAccountIdState('gbp-artisan');
      setCurrentPath('/user/dashboard');
    } else if (foundUser.role === 'agency') {
      setActiveGbpAccountIdState('gbp-blueharbor');
      setCurrentPath('/agency/dashboard');
    } else {
      setCurrentPath('/admin/dashboard');
    }

    addToast({
      type: 'success',
      title: `Welcome back, ${foundUser.name}!`,
      description: `Logged in to ${foundUser.role === 'single' ? 'Single User Panel' : foundUser.role === 'agency' ? 'Agency Panel' : 'Super Admin Operations'}.`
    });

    return { success: true };
  };

  const signup = async (
    role: 'single' | 'agency',
    name: string,
    email: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: `An account with ${email} already exists. Please log in.`
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: cleanEmail,
      role,
      planId: role === 'single' ? 'plan-single' : 'plan-agency-starter',
      companyName,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    };

    setUsers((prev) => [...prev, newUser]);
    setIsAuthenticated(true);
    setActiveRoleState(role);

    if (role === 'single') {
      setCurrentPath('/user/onboarding');
    } else {
      setCurrentPath('/agency/onboarding');
    }

    addToast({
      type: 'success',
      title: 'Account created successfully!',
      description: `Welcome to Partner.ai. Let's configure your Google Business Profile.`
    });

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    const prevRole = activeRole;
    if (prevRole === 'single') {
      setCurrentPath('/login/user');
    } else if (prevRole === 'agency') {
      setCurrentPath('/login/agency');
    } else if (prevRole === 'super_admin') {
      setCurrentPath('/login/admin');
    } else {
      setCurrentPath('/');
    }
    addToast({
      type: 'info',
      title: 'Signed out',
      description: 'You have been safely signed out.'
    });
  };

  const switchUserRole = useCallback((newRole: UserRole) => {
    setActiveRoleState(newRole);
    setIsAuthenticated(true);
    if (newRole === 'super_admin') {
      setCurrentPath('/admin/dashboard');
      addToast({
        type: 'info',
        title: 'Switched to Super Admin panel',
        description: 'Viewing platform telemetry, direct users, agencies, and pricing plans.'
      });
    } else if (newRole === 'agency') {
      setActiveGbpAccountIdState('gbp-blueharbor');
      setCurrentPath('/agency/dashboard');
      addToast({
        type: 'info',
        title: 'Switched to Agency panel (Marcus Vance)',
        description: 'Managing 5 connected client accounts with client switcher.'
      });
    } else {
      setActiveGbpAccountIdState('gbp-artisan');
      setCurrentPath('/user/dashboard');
      addToast({
        type: 'info',
        title: 'Switched to Single User panel (Elena Rostova)',
        description: 'Managing 1 connected business: Artisan Roast & Bakery.'
      });
    }
  }, [addToast]);

  const setActiveGbpAccountId = useCallback((id: string) => {
    setActiveGbpAccountIdState(id);
    const target = gbpAccounts.find((a) => a.id === id);
    if (target) {
      addToast({
        type: 'info',
        title: `Switched location: ${target.clientLabel || target.locationName}`,
        description: 'Dashboard metrics, posts, and reviews refreshed for this profile.'
      });
    }
  }, [gbpAccounts, addToast]);

  // Post Actions
  const createPost = async (newPostData: Omit<GbpPost, 'id'>): Promise<GbpPost> => {
    const post: GbpPost = {
      ...newPostData,
      id: `post-${Date.now()}`,
      viewsCount: newPostData.status === 'PUBLISHED' ? 12 : 0,
      clicksCount: 0,
      publishedAt: newPostData.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
    };
    setPosts((prev) => [post, ...prev]);
    addToast({
      type: 'success',
      title: post.status === 'SCHEDULED' ? 'Post scheduled successfully' : 'Post published to Google Profile',
      description: `Targeting: ${activeGbpAccount?.locationName}`,
    });
    return post;
  };

  const updatePost = async (id: string, updates: Partial<GbpPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    addToast({
      type: 'success',
      title: 'Post updated',
      description: 'Changes synced to Google Business Profile.',
    });
  };

  const deletePost = async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    addToast({
      type: 'info',
      title: 'Post deleted',
      description: 'The post has been removed.',
    });
  };

  const duplicatePost = async (id: string) => {
    const original = posts.find((p) => p.id === id);
    if (!original) return;
    const duplicated: GbpPost = {
      ...original,
      id: `post-${Date.now()}`,
      caption: `[Copy] ${original.caption}`,
      status: 'DRAFT',
      publishedAt: undefined,
      scheduledAt: undefined,
      viewsCount: 0,
      clicksCount: 0,
    };
    setPosts((prev) => [duplicated, ...prev]);
    addToast({
      type: 'success',
      title: 'Post duplicated',
      description: 'Created a new draft from the selected post.',
    });
  };

  const reschedulePost = async (id: string, newDate: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'SCHEDULED', scheduledAt: newDate } : p))
    );
    addToast({
      type: 'success',
      title: 'Post rescheduled',
      description: `New schedule: ${new Date(newDate).toLocaleString()}`,
    });
  };

  // Review Actions
  const replyToReview = async (id: string, replyText: string, replySource: 'manual' | 'ai') => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              replyText,
              replySource,
              repliedAt: new Date().toISOString(),
            }
          : r
      )
    );
    addToast({
      type: 'success',
      title: replySource === 'ai' ? 'AI Reply sent to Google' : 'Reply posted to Google',
      description: 'Review response is now live on Google Maps & Search.',
    });
  };

  // AI Reply Generator with Persona Integration
  const generateAiReply = async (review: GbpReview, customTone?: string): Promise<string> => {
    const config = aiConfigs[review.gbpAccountId] || aiConfigs['gbp-artisan'];
    const businessName = activeGbpAccount?.clientLabel || activeGbpAccount?.locationName || 'Our Business';

    // Simulate realistic AI generation with slight processing delay for authentic feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    const reviewerName = review.reviewerName.split(' ')[0] || 'valued guest';
    const isHighRating = review.rating >= 4;
    const isLowRating = review.rating <= 2;

    let reply = '';
    if (isHighRating) {
      if (customTone === 'concise') {
        reply = `Hi ${reviewerName}, thank you for the ${review.rating}-star review! We loved having you at ${businessName} and look forward to your next visit.`;
      } else if (customTone === 'luxury') {
        reply = `Dear ${reviewerName}, it is an absolute honor to receive your generous review. Our culinary and service team remains dedicated to delivering unparalleled experiences every single day. We eagerly anticipate welcoming you back soon.`;
      } else {
        reply = `Hello ${reviewerName}! Thank you so much for taking the time to leave us this glowing ${review.rating}-star review. We're thrilled to know you had such a great experience with us at ${businessName}. Looking forward to seeing you again very soon!`;
      }
    } else if (isLowRating) {
      reply = `Hello ${reviewerName}, thank you for your candid feedback. We are deeply sorry that your experience fell short of our standard of excellence. We take this seriously and would love the chance to make things right—please reach out to us directly so we can assist you.`;
    } else {
      reply = `Hi ${reviewerName}, thank you for your balanced feedback! We are always striving to improve our guest experience at ${businessName} and truly appreciate your insights. Hope to see you back again soon!`;
    }

    if (config?.signature) {
      reply = `${reply} ${config.signature}`;
    }

    return reply;
  };

  const updateAiConfig = async (accountId: string, updates: Partial<AiReplyConfig>) => {
    setAiConfigs((prev) => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] || {
          gbpAccountId: accountId,
          persona: 'Friendly, warm, professional brand voice.',
          autoReplyEnabled: false,
          autoReplyMinRating: 4,
          signature: '— The Management Team',
          llmProvider: 'anthropic',
          modelName: 'claude-3-5-sonnet',
        }),
        ...updates,
      },
    }));
    addToast({
      type: 'success',
      title: 'AI Persona & Settings Saved',
      description: 'New guidelines will shape all future generated replies.',
    });
  };

  // Photo Actions
  const uploadPhoto = async (
    photoData: Omit<GbpPhoto, 'id' | 'uploadedAt' | 'viewsCount'>
  ): Promise<GbpPhoto> => {
    const photo: GbpPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      viewsCount: 1,
      dimensions: photoData.dimensions || '1200 x 800',
    };
    setPhotos((prev) => [photo, ...prev]);
    addToast({
      type: 'success',
      title: 'Photo published to Google Business',
      description: `Category: ${photo.category} • Location: ${activeGbpAccount?.locationName}`,
    });
    return photo;
  };

  const deletePhoto = async (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    addToast({
      type: 'info',
      title: 'Photo removed',
      description: 'Image deleted from Google Business Profile.',
    });
  };

  // Pricing Plan Actions (Super Admin)
  const updatePricingPlan = async (id: string, updates: Partial<PricingPlan>) => {
    setPricingPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, version: (p.version || 1) + 1 } : p))
    );
    addToast({
      type: 'success',
      title: 'Pricing plan updated',
      description: 'New pricing and limits are now active platform-wide.',
    });
  };

  // Team Actions (Agency)
  const inviteTeamMember = async (
    name: string,
    email: string,
    role: 'admin' | 'manager' | 'contributor'
  ) => {
    const member: AgencyTeamMember = {
      id: `team-${Date.now()}`,
      agencyId: 'user-agency',
      name,
      email,
      role,
      assignedClientIds: [],
      invitedAt: new Date().toISOString(),
      status: 'pending',
    };
    setTeamMembers((prev) => [...prev, member]);
    addToast({
      type: 'success',
      title: `Invitation sent to ${email}`,
      description: `Role assigned: ${role.toUpperCase()}`,
    });
  };

  const removeTeamMember = async (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    addToast({
      type: 'info',
      title: 'Team member removed',
      description: 'Access revoked from agency client profiles.',
    });
  };

  // Global Settings Actions (Super Admin)
  const updateGlobalSettings = async (updates: Partial<GlobalPlatformSettings>) => {
    setGlobalSettings((prev) => ({ ...prev, ...updates }));
    addToast({
      type: 'success',
      title: 'Global platform settings saved',
      description: 'System configurations updated.',
    });
  };

  // Account Management
  const addGbpAccount = async (
    accountData: Omit<GbpAccount, 'id' | 'connected' | 'connectedAt'>
  ): Promise<GbpAccount> => {
    const newAcc: GbpAccount = {
      ...accountData,
      id: `gbp-${Date.now()}`,
      connected: true,
      connectedAt: new Date().toISOString(),
      healthScore: 90,
      rating: 4.8,
      reviewsCount: 15,
    };
    setGbpAccounts((prev) => [...prev, newAcc]);
    setActiveGbpAccountIdState(newAcc.id);
    addToast({
      type: 'success',
      title: 'Google Business Profile connected!',
      description: `Successfully authenticated location: ${newAcc.locationName}`,
    });
    return newAcc;
  };

  const updateGbpAccount = async (id: string, updates: Partial<GbpAccount>) => {
    setGbpAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
    addToast({
      type: 'success',
      title: 'Profile Details Saved',
      description: 'Google Business Profile details have been updated.',
    });
  };

  const disconnectGbpAccount = async (id: string) => {
    setGbpAccounts((prev) => prev.filter((a) => a.id !== id));
    addToast({
      type: 'warning',
      title: 'Google Account Disconnected',
      description: 'Access token revoked and location unlinked.',
    });
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    addToast({
      type: 'success',
      title: 'Personal Profile Updated',
      description: 'Your profile changes have been saved.',
    });
  };

  const upgradeUserPlan = async (newPlanId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, planId: newPlanId } : u))
    );
    const planName = pricingPlans.find((p) => p.id === newPlanId)?.name || newPlanId;
    addToast({
      type: 'success',
      title: `Upgraded to ${planName}!`,
      description: 'Your new account quotas and features are immediately active.',
    });
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setActiveRoleState('single');
    setGbpAccounts(INITIAL_GBP_ACCOUNTS);
    setActiveGbpAccountIdState('gbp-artisan');
    setPosts(INITIAL_POSTS);
    setReviews(INITIAL_REVIEWS);
    setAiConfigs(INITIAL_AI_CONFIGS);
    setPhotos(INITIAL_PHOTOS);
    setPricingPlans(INITIAL_PRICING_PLANS);
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    setGlobalSettings(INITIAL_GLOBAL_SETTINGS);
    setCurrentPath('/user/dashboard');
    addToast({
      type: 'info',
      title: 'Database Reset',
      description: 'All mock stores restored to initial demonstration state.',
    });
  };

  const getKpisForAccount = (accountId: string, period: '7d' | '30d' | '90d'): KpiSummary => {
    const mult = period === '7d' ? 1 : period === '30d' ? 3.8 : 9.5;
    const accountReviews = reviews.filter((r) => accountId === 'all' || r.gbpAccountId === accountId);
    const accountPosts = posts.filter((p) => accountId === 'all' || p.gbpAccountId === accountId);

    const baseViews = 4610;
    return {
      gbpAccountId: accountId,
      rangeStart: '2024-03-01',
      rangeEnd: '2024-03-15',
      views: Math.round(baseViews * mult),
      searches: Math.round(3420 * mult),
      calls: Math.round(303 * mult),
      directionRequests: Math.round(517 * mult),
      websiteClicks: Math.round(448 * mult),
      avgRating: 4.8,
      reviewCount: accountReviews.length * 15,
      postCount: accountPosts.length,
      viewsTrend: 14.8,
      callsTrend: 8.2,
      directionsTrend: 19.5,
      clicksTrend: 11.4,
    };
  };

  const impersonateUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setActiveRoleState(target.role);
      if (target.role === 'agency') {
        const firstAgencyGbp = gbpAccounts.find((a) => a.ownerUserId === target.id);
        if (firstAgencyGbp) setActiveGbpAccountIdState(firstAgencyGbp.id);
        setCurrentPath('/agency/dashboard');
      } else if (target.role === 'single') {
        const firstSingleGbp = gbpAccounts.find((a) => a.ownerUserId === target.id);
        if (firstSingleGbp) setActiveGbpAccountIdState(firstSingleGbp.id);
        setCurrentPath('/user/dashboard');
      } else {
        setCurrentPath('/admin');
      }
      addToast({
        type: 'info',
        title: `Impersonating ${target.name}`,
        description: `Logged in with ${target.role.toUpperCase()} tenant context.`,
      });
    }
  };

  const adminPlatformStats = {
    mrr: 48950,
    totalUsers: users.length * 280,
    singleUsers: 720,
    agencyUsers: 142,
    totalGbpLocations: gbpAccounts.length * 340,
    churnRate: 1.8,
    totalTokensMonth: 42800000,
    googleApiQuotaUsed: 38,
  };

  return (
    <PartnerContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated,
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
        updateCurrentUser,
        upgradeUserPlan,
        allUsers: users,
        adminPlatformStats,
        impersonateUser,
        toasts,
        addToast,
        removeToast,
        resetToDefaults,
        getKpisForAccount,
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
