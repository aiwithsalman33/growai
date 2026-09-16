// src/lib/api/index.ts - Typed API client layer for Partner.ai
import {
  GbpAccount,
  GbpPost,
  GbpReview,
  GbpPhoto,
  PricingPlan,
  KpiSummary,
  AiReplyConfig,
  GlobalPlatformSettings
} from '../../types';

export const postsApi = {
  async list(gbpAccountId: string): Promise<GbpPost[]> {
    return [];
  },
  async create(payload: Omit<GbpPost, 'id'>): Promise<GbpPost> {
    return { ...payload, id: `post-${Date.now()}` };
  },
  async update(id: string, updates: Partial<GbpPost>): Promise<GbpPost> {
    return { id, ...updates } as GbpPost;
  },
  async delete(id: string): Promise<boolean> {
    return true;
  }
};

export const reviewsApi = {
  async list(gbpAccountId: string): Promise<GbpReview[]> {
    return [];
  },
  async sendReply(id: string, replyText: string, replySource: 'manual' | 'ai'): Promise<boolean> {
    return true;
  },
  async generateAiReply(reviewId: string, options?: { tone?: string }): Promise<string> {
    return "Thank you for visiting! We look forward to seeing you again.";
  }
};

export const photosApi = {
  async list(gbpAccountId: string): Promise<GbpPhoto[]> {
    return [];
  },
  async upload(payload: FormData): Promise<GbpPhoto> {
    return {
      id: `photo-${Date.now()}`,
      gbpAccountId: 'gbp-current',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
      category: 'INTERIOR',
      uploadedAt: new Date().toISOString()
    };
  },
  async delete(id: string): Promise<boolean> {
    return true;
  }
};

export const gbpApi = {
  async getAccounts(): Promise<GbpAccount[]> {
    return [];
  },
  async connectOAuth(authCode: string): Promise<GbpAccount> {
    return {} as GbpAccount;
  },
  async disconnect(id: string): Promise<boolean> {
    return true;
  }
};

export const billingApi = {
  async getPlans(): Promise<PricingPlan[]> {
    return [];
  },
  async updateSubscription(planId: string): Promise<boolean> {
    return true;
  }
};

export const adminApi = {
  async getPlatformKpis(): Promise<{
    mrr: number;
    activeUsers: number;
    totalSignups: number;
    churnRate: number;
    apiUsageTokens: number;
  }> {
    return {
      mrr: 64800,
      activeUsers: 1957,
      totalSignups: 2480,
      churnRate: 1.2,
      apiUsageTokens: 4920400
    };
  }
};
