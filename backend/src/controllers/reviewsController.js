const Joi = require('joi');
const prisma = require('../config/db');
const gbpService = require('../services/gbpService');
const aiReplyService = require('../services/aiReplyService');
const { accessibleAccountIds } = require('../middleware/ownership');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }
  return value;
}

const list = asyncHandler(async (req, res) => {
  const { gbpAccountId, replied } = req.query;
  const allowed = await accessibleAccountIds(req.user);

  const where = {};
  if (gbpAccountId) where.gbpAccountId = gbpAccountId;
  if (allowed) where.gbpAccountId = gbpAccountId || { in: allowed };
  if (allowed && gbpAccountId && !allowed.includes(gbpAccountId)) {
    throw new ApiError(403, 'You do not have access to this GBP account');
  }
  if (replied === 'true') where.replyText = { not: null };
  if (replied === 'false') where.replyText = null;

  const reviews = await prisma.gbpReview.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

/**
 * Pulls reviews from Google and upserts them. Google is the source of truth —
 * a reply made in the Google UI shows up here on the next sync.
 */
const sync = asyncHandler(async (req, res) => {
  const account = req.gbpAccount;
  if (!account.connected) {
    throw new ApiError(409, 'Connect this account to Google first');
  }

  const incoming = await gbpService.listReviews(account);
  let created = 0;
  let updated = 0;

  for (const review of incoming) {
    const existing = review.googleReviewId
      ? await prisma.gbpReview.findUnique({
          where: { googleReviewId: review.googleReviewId },
        })
      : null;

    if (existing) {
      await prisma.gbpReview.update({
        where: { id: existing.id },
        data: { replyText: review.replyText, repliedAt: review.repliedAt },
      });
      updated += 1;
    } else {
      await prisma.gbpReview.create({
        data: { ...review, gbpAccountId: account.id },
      });
      created += 1;
    }
  }

  await maybeAutoReply(account, req.user.id);

  res.json({ synced: incoming.length, created, updated });
});

/**
 * Runs after a sync: replies unattended to anything that clears the configured
 * rating floor. Every send is written to the audit log — an automated public
 * statement on the business's behalf should never be untraceable.
 */
async function maybeAutoReply(account, actorId) {
  const config = await prisma.aiReplyConfig.findUnique({
    where: { gbpAccountId: account.id },
  });
  if (!config?.autoReplyEnabled) return;

  const candidates = await prisma.gbpReview.findMany({
    where: {
      gbpAccountId: account.id,
      replyText: null,
      rating: { gte: config.autoReplyMinRating },
    },
    take: 10,
  });

  for (const review of candidates) {
    if (!aiReplyService.shouldAutoReply(review, config)) continue;
    try {
      const { text, usage } = await aiReplyService.generateReply({
        review,
        config,
        businessName: account.clientLabel || account.locationName,
      });
      await recordUsage({ usage, userId: config.userId, account, review, source: 'auto' });
      await sendReply(account, review, text, 'ai');
      await prisma.auditLog.create({
        data: {
          actorId: `system:auto-reply:${actorId}`,
          action: 'review.auto_replied',
          targetType: 'GbpReview',
          targetId: review.id,
          metadata: { rating: review.rating, gbpAccountId: account.id },
        },
      });
    } catch {
      // One failed reply must not abort the whole sync.
    }
  }
}

/**
 * One row per generation, so the usage panel reports what was actually spent
 * instead of a sample array. Never fails the request it belongs to.
 */
async function recordUsage({ usage, userId, account, review, source }) {
  if (!usage || !userId) return;
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        gbpAccountId: account?.id || null,
        reviewId: review?.id || null,
        reviewerName: review?.reviewerName || null,
        rating: review?.rating ?? null,
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUsd: usage.costUsd,
        source,
      },
    });
  } catch {
    // Metering must never break the reply it is measuring.
  }
}

async function sendReply(account, review, text, source) {
  if (review.googleReviewId && account.connected) {
    await gbpService.replyToReview(account, review.googleReviewId, text);
  }
  return prisma.gbpReview.update({
    where: { id: review.id },
    data: { replyText: text, repliedAt: new Date(), replySource: source },
  });
}

/** Generates a draft only — nothing is published until `reply` is called. */
const generateAiReply = asyncHandler(async (req, res) => {
  const { tone } = validate(
    Joi.object({ tone: Joi.string().trim().max(400).allow('', null) }),
    req.body
  );

  const config = await prisma.aiReplyConfig.findUnique({
    where: { gbpAccountId: req.record.gbpAccountId },
  });

  const { text, usage } = await aiReplyService.generateReply({
    review: req.record,
    config: config || {},
    businessName: req.gbpAccount.clientLabel || req.gbpAccount.locationName,
    customTone: tone,
  });

  await recordUsage({
    usage,
    userId: req.user.id,
    account: req.gbpAccount,
    review: req.record,
    source: 'manual',
  });

  res.json({ reply: text, usage });
});

const reply = asyncHandler(async (req, res) => {
  const { replyText, replySource } = validate(
    Joi.object({
      replyText: Joi.string().trim().min(1).max(4000).required(),
      replySource: Joi.string().valid('manual', 'ai').default('manual'),
    }),
    req.body
  );

  const review = await sendReply(req.gbpAccount, req.record, replyText, replySource);

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'review.replied',
      targetType: 'GbpReview',
      targetId: review.id,
      metadata: { replySource },
    },
  });

  res.json({ review });
});

module.exports = { list, sync, generateAiReply, reply };
