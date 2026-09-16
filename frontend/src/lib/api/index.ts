// src/lib/api/index.ts — typed API client for Partner.ai.
//
// The access token is held in memory only. The refresh token lives in an
// httpOnly cookie the browser cannot read, so a 401 is recovered by calling
// /auth/refresh rather than by reading a token out of localStorage.
import {
  User,
  UserRole,
  GbpAccount,
  GbpPost,
  GbpReview,
  GbpPhoto,
  PricingPlan,
  KpiSummary,
  AiReplyConfig,
  AgencyTeamMember,
  GlobalPlatformSettings,
} from '../../types';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export interface TrendPoint {
  date: string;
  views: number;
  searches: number;
  calls: number;
  directions: number;
  clicks: number;
  reviews: number;
  posts: number;
}

export interface AiUsageRecord {
  id: string;
  createdAt: string;
  reviewerName: string | null;
  rating: number | null;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  source: string;
}

export interface AiUsageSummary {
  logs: AiUsageRecord[];
  monthStart: string;
  repliesThisMonth: number;
  tokensThisMonth: number;
  costThisMonth: number;
  repliesAllTime: number;
  tokensAllTime: number;
  costAllTime: number;
  /** null means the plan carries no cap. */
  quota: number | null;
  quotaRemaining: number | null;
  planName: string | null;
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** The store registers a callback so a dead session routes back to login. */
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  onUnauthenticated = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  retry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(
    `${BASE}${path}`,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || `Request failed (${res.status})`;
  let details: string[] | undefined;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
    if (Array.isArray(body?.details)) details = body.details;
  } catch {
    // A non-JSON error body (a proxy 502, say) keeps the status text.
  }
  return new ApiError(res.status, message, details);
}

/** Single-flight refresh so parallel 401s don't stampede the endpoint. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const data = await res.json();
        accessToken = data.accessToken;
        return true;
      } catch {
        return false;
      } finally {
        // Cleared on the next tick so concurrent callers share this result.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, retry = true } = options;

  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  // Let the browser set the multipart boundary itself.
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      return request<T>(path, { ...options, retry: false });
    }
    accessToken = null;
    onUnauthenticated?.();
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Normalizers — the API is the source of truth, but nullable columns have to
// land on the non-optional shapes the UI types declare.
// ---------------------------------------------------------------------------

function normalizeUser(raw: any): User {
  return {
    ...raw,
    planId: raw.planId ?? '',
    companyName: raw.companyName ?? undefined,
    avatarUrl: raw.avatarUrl ?? undefined,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function normalizeAccount(raw: any): GbpAccount {
  return { ...raw, connected: Boolean(raw.connected) };
}

function normalizeReview(raw: any): GbpReview {
  return { ...raw, rating: Math.min(5, Math.max(1, raw.rating || 1)) as GbpReview['rating'] };
}

function normalizePlan(raw: any): PricingPlan {
  return { ...raw, features: Array.isArray(raw.features) ? raw.features : [] };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const PORTAL_PATH: Record<UserRole, string> = {
  single: 'user',
  agency: 'agency',
  super_admin: 'admin',
  admin: 'admin',
};

export const authApi = {
  async login(role: UserRole, email: string, password: string) {
    const data = await request<{ user: any; accessToken: string }>(
      `/auth/${PORTAL_PATH[role]}/login`,
      { method: 'POST', body: { email, password } }
    );
    accessToken = data.accessToken;
    return normalizeUser(data.user);
  },

  async signup(
    role: 'single' | 'agency',
    payload: { name: string; email: string; password: string; companyName?: string }
  ) {
    const data = await request<{ user: any; accessToken: string }>(
      `/auth/${PORTAL_PATH[role]}/signup`,
      { method: 'POST', body: payload }
    );
    accessToken = data.accessToken;
    return normalizeUser(data.user);
  },

  /** Restores a session on page load using the refresh cookie alone. */
  async restore(): Promise<User | null> {
    const ok = await refreshSession();
    if (!ok) return null;
    try {
      const { user } = await request<{ user: any }>('/auth/me');
      return normalizeUser(user);
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      accessToken = null;
    }
  },

  async updateProfile(updates: Partial<User>) {
    const { user } = await request<{ user: any }>('/auth/me', {
      method: 'PATCH',
      body: updates,
    });
    return normalizeUser(user);
  },
};

// ---------------------------------------------------------------------------
// GBP accounts
// ---------------------------------------------------------------------------

export const gbpApi = {
  async getAccounts(): Promise<GbpAccount[]> {
    const { accounts } = await request<{ accounts: any[] }>('/gbp');
    return accounts.map(normalizeAccount);
  },

  async create(payload: Partial<GbpAccount>): Promise<GbpAccount> {
    const { account } = await request<{ account: any }>('/gbp', {
      method: 'POST',
      body: payload,
    });
    return normalizeAccount(account);
  },

  async update(id: string, updates: Partial<GbpAccount>): Promise<GbpAccount> {
    const { account } = await request<{ account: any }>(`/gbp/${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return normalizeAccount(account);
  },

  /** Returns Google's consent URL — the caller redirects the browser to it. */
  async startOAuth(id: string): Promise<string> {
    const { url } = await request<{ url: string }>(`/gbp/${id}/oauth/start`, {
      method: 'POST',
    });
    return url;
  },

  async disconnect(id: string): Promise<GbpAccount> {
    const { account } = await request<{ account: any }>(`/gbp/${id}/disconnect`, {
      method: 'POST',
    });
    return normalizeAccount(account);
  },

  async remove(id: string): Promise<boolean> {
    await request(`/gbp/${id}`, { method: 'DELETE' });
    return true;
  },

  async getAiConfig(id: string): Promise<AiReplyConfig> {
    const { config } = await request<{ config: AiReplyConfig }>(`/gbp/${id}/ai-config`);
    return config;
  },

  async updateAiConfig(id: string, updates: Partial<AiReplyConfig>): Promise<AiReplyConfig> {
    const { config } = await request<{ config: AiReplyConfig }>(`/gbp/${id}/ai-config`, {
      method: 'PUT',
      body: updates,
    });
    return config;
  },
};

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export const postsApi = {
  async list(gbpAccountId?: string): Promise<GbpPost[]> {
    const { posts } = await request<{ posts: GbpPost[] }>('/posts', {
      query: { gbpAccountId: gbpAccountId === 'all' ? undefined : gbpAccountId },
    });
    return posts;
  },

  async create(payload: Omit<GbpPost, 'id'>): Promise<GbpPost> {
    const { post } = await request<{ post: GbpPost }>('/posts', {
      method: 'POST',
      body: payload,
    });
    return post;
  },

  async update(id: string, updates: Partial<GbpPost>): Promise<GbpPost> {
    const { post } = await request<{ post: GbpPost }>(`/posts/${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return post;
  },

  async publish(id: string): Promise<GbpPost> {
    const { post } = await request<{ post: GbpPost }>(`/posts/${id}/publish`, {
      method: 'POST',
    });
    return post;
  },

  async reschedule(id: string, scheduledAt: string): Promise<GbpPost> {
    const { post } = await request<{ post: GbpPost }>(`/posts/${id}/reschedule`, {
      method: 'POST',
      body: { scheduledAt },
    });
    return post;
  },

  async duplicate(id: string): Promise<GbpPost> {
    const { post } = await request<{ post: GbpPost }>(`/posts/${id}/duplicate`, {
      method: 'POST',
    });
    return post;
  },

  async delete(id: string): Promise<boolean> {
    await request(`/posts/${id}`, { method: 'DELETE' });
    return true;
  },

  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const { url } = await request<{ url: string }>('/posts/image', {
      method: 'POST',
      body: form,
    });
    return url;
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewsApi = {
  async list(gbpAccountId?: string): Promise<GbpReview[]> {
    const { reviews } = await request<{ reviews: any[] }>('/reviews', {
      query: { gbpAccountId: gbpAccountId === 'all' ? undefined : gbpAccountId },
    });
    return reviews.map(normalizeReview);
  },

  async sync(gbpAccountId: string) {
    return request<{ synced: number; created: number; updated: number }>(
      '/reviews/sync',
      { method: 'POST', body: { gbpAccountId } }
    );
  },

  async sendReply(
    id: string,
    replyText: string,
    replySource: 'manual' | 'ai'
  ): Promise<GbpReview> {
    const { review } = await request<{ review: any }>(`/reviews/${id}/reply`, {
      method: 'POST',
      body: { replyText, replySource },
    });
    return normalizeReview(review);
  },

  /** Returns a draft. Nothing is published until sendReply is called. */
  async generateAiReply(reviewId: string, options?: { tone?: string }): Promise<string> {
    const { reply } = await request<{ reply: string }>(`/reviews/${reviewId}/ai-reply`, {
      method: 'POST',
      body: { tone: options?.tone },
    });
    return reply;
  },
};

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export const photosApi = {
  async list(gbpAccountId?: string): Promise<GbpPhoto[]> {
    const { photos } = await request<{ photos: GbpPhoto[] }>('/photos', {
      query: { gbpAccountId: gbpAccountId === 'all' ? undefined : gbpAccountId },
    });
    return photos;
  },

  async upload(payload: FormData): Promise<GbpPhoto> {
    const { photo } = await request<{ photo: GbpPhoto }>('/photos', {
      method: 'POST',
      body: payload,
    });
    return photo;
  },

  async delete(id: string): Promise<boolean> {
    await request(`/photos/${id}`, { method: 'DELETE' });
    return true;
  },
};

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export const kpisApi = {
  async summary(gbpAccountId: string, period: '7d' | '30d' | '90d'): Promise<KpiSummary> {
    const { kpis } = await request<{ kpis: any }>('/kpis/summary', {
      query: { gbpAccountId, period },
    });
    return kpis as KpiSummary;
  },

  async comparison(period: '7d' | '30d' | '90d' = '30d') {
    const { clients } = await request<{ clients: any[] }>('/kpis/comparison', {
      query: { period },
    });
    return clients;
  },

  /** Points for the dashboard trend chart — real rows, never a fixture. */
  async timeseries(
    gbpAccountId: string,
    period: '7d' | '30d' | '90d'
  ): Promise<{ series: TrendPoint[]; engagementAvailable: boolean }> {
    return request<{ series: TrendPoint[]; engagementAvailable: boolean }>(
      '/kpis/timeseries',
      { query: { gbpAccountId, period } }
    );
  },
};

export const aiUsageApi = {
  async summary(limit = 25): Promise<AiUsageSummary> {
    const { usage } = await request<{ usage: AiUsageSummary }>('/ai-usage', {
      query: { limit },
    });
    return usage;
  },

  async byAccount() {
    const { accounts } = await request<{ accounts: any[] }>('/ai-usage/by-account');
    return accounts;
  },
};

// ---------------------------------------------------------------------------
// Agency
// ---------------------------------------------------------------------------

export const agencyApi = {
  async listClients() {
    const { clients } = await request<{ clients: any[] }>('/agency/clients');
    return clients.map(normalizeAccount);
  },

  async listTeam(): Promise<AgencyTeamMember[]> {
    const { members } = await request<{ members: AgencyTeamMember[] }>('/agency/team');
    return members;
  },

  async inviteMember(
    name: string,
    email: string,
    role: 'admin' | 'manager' | 'contributor'
  ): Promise<AgencyTeamMember> {
    const { member } = await request<{ member: AgencyTeamMember }>('/agency/team', {
      method: 'POST',
      body: { name, email, role },
    });
    return member;
  },

  async updateMember(id: string, updates: Partial<AgencyTeamMember>) {
    const { member } = await request<{ member: AgencyTeamMember }>(`/agency/team/${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return member;
  },

  async removeMember(id: string): Promise<boolean> {
    await request(`/agency/team/${id}`, { method: 'DELETE' });
    return true;
  },
};

// ---------------------------------------------------------------------------
// Billing / plans
// ---------------------------------------------------------------------------

export const billingApi = {
  /** Public — the marketing pricing page calls this without a session. */
  async getPlans(): Promise<PricingPlan[]> {
    const { plans } = await request<{ plans: any[] }>('/plans');
    return plans.map(normalizePlan);
  },

  async updateSubscription(planId: string): Promise<User> {
    const { user } = await request<{ user: any }>('/billing/plan', {
      method: 'POST',
      body: { planId },
    });
    return normalizeUser(user);
  },
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  async getPlatformKpis() {
    const { stats } = await request<{ stats: Record<string, number> }>('/admin/stats');
    return stats;
  },

  async listUsers(query?: string): Promise<User[]> {
    const { users } = await request<{ users: any[] }>('/admin/users/all', {
      query: { q: query },
    });
    return users.map(normalizeUser);
  },

  async updateUser(id: string, updates: Partial<User> & { password?: string }) {
    const { user } = await request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return normalizeUser(user);
  },

  async deleteUser(id: string): Promise<boolean> {
    await request(`/admin/users/${id}`, { method: 'DELETE' });
    return true;
  },

  /** Swaps the in-memory token for one scoped to the target user. */
  async impersonate(id: string): Promise<User> {
    const data = await request<{ user: any; accessToken: string }>(
      `/admin/users/${id}/impersonate`,
      { method: 'POST' }
    );
    accessToken = data.accessToken;
    return normalizeUser(data.user);
  },

  async listPlans(): Promise<PricingPlan[]> {
    const { plans } = await request<{ plans: any[] }>('/admin/pricing');
    return plans.map(normalizePlan);
  },

  async updatePlan(id: string, updates: Partial<PricingPlan>): Promise<PricingPlan> {
    const { plan } = await request<{ plan: any }>(`/admin/pricing/${id}`, {
      method: 'PATCH',
      body: updates,
    });
    return normalizePlan(plan);
  },

  async getSettings(): Promise<GlobalPlatformSettings> {
    const { settings } = await request<{ settings: GlobalPlatformSettings }>(
      '/admin/settings'
    );
    return settings;
  },

  async updateSettings(
    updates: Partial<GlobalPlatformSettings>
  ): Promise<GlobalPlatformSettings> {
    const { settings } = await request<{ settings: GlobalPlatformSettings }>(
      '/admin/settings',
      { method: 'PATCH', body: updates }
    );
    return settings;
  },

  async auditLog(limit = 100) {
    const { logs } = await request<{ logs: any[] }>('/admin/audit-log', {
      query: { limit },
    });
    return logs;
  },

  /** Dev-only on the server; rejected in production. */
  async reseed() {
    return request<{ success: boolean }>('/admin/seed', { method: 'POST' });
  },
};

export interface HealthReport {
  status: string;
  database: string;
  /** 'configured' once GOOGLE_CLIENT_ID/SECRET are set on the server. */
  google: 'configured' | 'not_configured';
  uptime: number;
}

export const healthApi = {
  check: () => request<HealthReport>('/health'),
};
