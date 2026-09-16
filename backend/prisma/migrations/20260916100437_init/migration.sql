-- CreateEnum
CREATE TYPE "Role" AS ENUM ('single', 'agency', 'super_admin');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('STANDARD', 'EVENT', 'OFFER', 'PRODUCT');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('LOGO', 'COVER', 'INTERIOR', 'EXTERIOR', 'PRODUCT', 'TEAM', 'IDENTITY', 'AT_WORK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "planId" TEXT,
    "agencyId" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GbpAccount" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "clientLabel" TEXT,
    "locationName" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "googleLocationId" TEXT NOT NULL,
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "placeId" TEXT,
    "category" TEXT,
    "description" TEXT,
    "openingHours" JSONB,
    "healthScore" INTEGER,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GbpAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GbpPost" (
    "id" TEXT NOT NULL,
    "gbpAccountId" TEXT NOT NULL,
    "type" "PostType" NOT NULL,
    "imageUrl" TEXT,
    "caption" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaLink" TEXT,
    "eventTitle" TEXT,
    "eventStart" TIMESTAMP(3),
    "eventEnd" TIMESTAMP(3),
    "couponCode" TEXT,
    "terms" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "clicksCount" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GbpPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GbpReview" (
    "id" TEXT NOT NULL,
    "gbpAccountId" TEXT NOT NULL,
    "googleReviewId" TEXT,
    "reviewerName" TEXT NOT NULL,
    "reviewerPhoto" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "sentiment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "replySource" TEXT,

    CONSTRAINT "GbpReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GbpPhoto" (
    "id" TEXT NOT NULL,
    "gbpAccountId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "PhotoCategory" NOT NULL,
    "caption" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "dimensions" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GbpPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiReplyConfig" (
    "id" TEXT NOT NULL,
    "gbpAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyMinRating" INTEGER NOT NULL DEFAULT 4,
    "signature" TEXT,
    "llmProvider" TEXT DEFAULT 'anthropic',
    "modelName" TEXT,
    "apiKeyMasked" TEXT,

    CONSTRAINT "AiReplyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyTeamMember" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedClientIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "maxGbpAccounts" INTEGER NOT NULL,
    "isAgencyPlan" BOOLEAN NOT NULL DEFAULT false,
    "features" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "aiReplyQuota" INTEGER,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalPlatformSettings" (
    "id" TEXT NOT NULL,
    "defaultLlmProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "defaultModel" TEXT NOT NULL DEFAULT 'claude-opus-5',
    "platformName" TEXT NOT NULL DEFAULT 'Partner.ai',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "globalAnnouncement" TEXT,
    "systemPromptPreset" TEXT,
    "apiRateLimitPerMin" INTEGER NOT NULL DEFAULT 120,
    "gbpSyncIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalPlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "GbpAccount_ownerUserId_idx" ON "GbpAccount"("ownerUserId");

-- CreateIndex
CREATE INDEX "GbpPost_gbpAccountId_idx" ON "GbpPost"("gbpAccountId");

-- CreateIndex
CREATE INDEX "GbpPost_status_scheduledAt_idx" ON "GbpPost"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "GbpReview_googleReviewId_key" ON "GbpReview"("googleReviewId");

-- CreateIndex
CREATE INDEX "GbpReview_gbpAccountId_idx" ON "GbpReview"("gbpAccountId");

-- CreateIndex
CREATE INDEX "GbpPhoto_gbpAccountId_idx" ON "GbpPhoto"("gbpAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AiReplyConfig_gbpAccountId_key" ON "AiReplyConfig"("gbpAccountId");

-- CreateIndex
CREATE INDEX "AgencyTeamMember_agencyId_idx" ON "AgencyTeamMember"("agencyId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GbpAccount" ADD CONSTRAINT "GbpAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GbpPost" ADD CONSTRAINT "GbpPost_gbpAccountId_fkey" FOREIGN KEY ("gbpAccountId") REFERENCES "GbpAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GbpReview" ADD CONSTRAINT "GbpReview_gbpAccountId_fkey" FOREIGN KEY ("gbpAccountId") REFERENCES "GbpAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GbpPhoto" ADD CONSTRAINT "GbpPhoto_gbpAccountId_fkey" FOREIGN KEY ("gbpAccountId") REFERENCES "GbpAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReplyConfig" ADD CONSTRAINT "AiReplyConfig_gbpAccountId_fkey" FOREIGN KEY ("gbpAccountId") REFERENCES "GbpAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReplyConfig" ADD CONSTRAINT "AiReplyConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyTeamMember" ADD CONSTRAINT "AgencyTeamMember_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
