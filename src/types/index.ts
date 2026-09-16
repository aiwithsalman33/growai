// types/index.ts - Core types for Partner.ai

export type UserRole = 'single' | 'agency' | 'super_admin' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  planId: string;
  avatarUrl?: string;
  createdAt: string;
  companyName?: string;
  /** Present on the admin list endpoints only. */
  plan?: PricingPlan;
  gbpAccountCount?: number;
  teamMemberCount?: number;
}

export interface GbpAccount {
  id: string;
  ownerUserId: string;      // single user id OR agency user id
  clientLabel?: string;     // agency: friendly name for this client
  locationName: string;
  googleAccountId: string;
  address?: string;
  phone?: string;
  website?: string;
  placeId?: string;
  category?: string;
  description?: string;
  openingHours?: string;
  connected: boolean;
  connectedAt?: string;
  healthScore?: number; // 0-100
  rating?: number;
  reviewsCount?: number;
}

export type PostType = 'STANDARD' | 'EVENT' | 'OFFER' | 'PRODUCT';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface GbpPost {
  id: string;
  gbpAccountId: string;
  type: PostType;
  imageUrl: string;
  caption: string;
  ctaLabel?: string;
  ctaLink?: string;
  eventTitle?: string;
  eventStart?: string;
  eventEnd?: string;
  couponCode?: string;
  terms?: string;
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  viewsCount?: number;
  clicksCount?: number;
}

export interface GbpReview {
  id: string;
  gbpAccountId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: string;
  replyText?: string;
  repliedAt?: string;
  replySource?: 'manual' | 'ai';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface AiReplyConfig {
  gbpAccountId: string;
  persona: string;          // behavior/tone script
  autoReplyEnabled: boolean;
  autoReplyMinRating: number; // e.g. only auto-send >= 4
  signature?: string;
  llmProvider: 'anthropic' | 'openai' | 'google_gemini';
  modelName: string;
  apiKeyMasked?: string;
}

export type PhotoCategory =
  | 'LOGO' | 'COVER' | 'INTERIOR' | 'EXTERIOR'
  | 'PRODUCT' | 'TEAM' | 'IDENTITY' | 'AT_WORK';

export interface GbpPhoto {
  id: string;
  gbpAccountId: string;
  url: string;
  category: PhotoCategory;
  caption?: string;
  uploadedAt: string;
  viewsCount?: number;
  dimensions?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  maxGbpAccounts: number;   // 1 for single-tier plans
  features: string[];
  isAgencyPlan: boolean;
  version?: number;
  activeSubscribers?: number;
  aiReplyQuota?: number;
}

export interface KpiSummary {
  gbpAccountId: string;
  rangeStart: string;
  rangeEnd: string;
  views: number;
  searches: number;
  calls: number;
  directionRequests: number;
  websiteClicks: number;
  avgRating: number;
  reviewCount: number;
  postCount: number;
  viewsTrend: number; // percentage diff e.g. +14.2
  callsTrend: number;
  directionsTrend: number;
  clicksTrend: number;
}

export interface AgencyTeamMember {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contributor';
  assignedClientIds: string[]; // empty means all
  avatarUrl?: string;
  invitedAt: string;
  status: 'active' | 'pending';
}

export interface GlobalPlatformSettings {
  defaultLlmProvider: 'anthropic' | 'openai' | 'google_gemini';
  defaultModel: string;
  maintenanceMode: boolean;
  globalAnnouncement: string;
  systemPromptPreset: string;
  apiRateLimitPerMin: number;
  gbpSyncIntervalMinutes: number;
}
