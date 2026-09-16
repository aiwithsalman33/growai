const Joi = require('joi');
const prisma = require('../config/db');
const env = require('../config/env');
const { generateTokens, publicUser, hashPassword } = require('../services/tokenService');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }
  return value;
}

// ---------------------------------------------------------------------------
// Platform overview
// ---------------------------------------------------------------------------

const stats = asyncHandler(async (req, res) => {
  const [users, singleUsers, agencyUsers, locations, plans, connected] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'single' } }),
      prisma.user.count({ where: { role: 'agency' } }),
      prisma.gbpAccount.count(),
      prisma.pricingPlan.findMany(),
      prisma.gbpAccount.count({ where: { connected: true } }),
    ]);

  // MRR is derived from what each user is actually on, not a stored figure.
  const planPrice = Object.fromEntries(plans.map((p) => [p.id, p.priceMonthly]));
  const subscribers = await prisma.user.groupBy({
    by: ['planId'],
    _count: { _all: true },
    where: { planId: { not: null } },
  });
  const mrr = subscribers.reduce(
    (total, row) => total + (planPrice[row.planId] || 0) * row._count._all,
    0
  );

  res.json({
    stats: {
      mrr,
      totalUsers: users,
      singleUsers,
      agencyUsers,
      totalGbpLocations: locations,
      connectedGbpLocations: connected,
    },
  });
});

// ---------------------------------------------------------------------------
// Users & agencies
// ---------------------------------------------------------------------------

function listByRole(...roles) {
  return asyncHandler(async (req, res) => {
    const { q } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: { in: roles },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { companyName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        plan: true,
        _count: { select: { gbpAccounts: true, teamMembers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      users: users.map((u) => ({
        ...publicUser(u),
        gbpAccountCount: u._count.gbpAccounts,
        teamMemberCount: u._count.teamMembers,
      })),
    });
  });
}

const updateUser = asyncHandler(async (req, res) => {
  const data = validate(
    Joi.object({
      name: Joi.string().trim().min(2).max(120),
      email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }),
      role: Joi.string().valid('single', 'agency', 'super_admin'),
      planId: Joi.string().uuid().allow(null),
      companyName: Joi.string().trim().max(200).allow('', null),
      password: Joi.string().min(8).max(200),
    }),
    req.body
  );

  const { password, ...fields } = data;
  if (password) fields.passwordHash = await hashPassword(password);

  const user = await prisma.user.update({ where: { id: req.params.id }, data: fields });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'admin.user_updated',
      targetType: 'User',
      targetId: user.id,
      metadata: { fields: Object.keys(fields) },
    },
  });

  res.json({ user: publicUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  await prisma.user.delete({ where: { id: req.params.id } });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'admin.user_deleted',
      targetType: 'User',
      targetId: req.params.id,
    },
  });

  res.json({ success: true });
});

/**
 * Issues a token for another user so an admin can reproduce what that user
 * sees. Always audited — this is the most sensitive action in the platform.
 */
const impersonate = asyncHandler(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new ApiError(404, 'User not found');

  const { accessToken } = generateTokens(target);

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'admin.impersonated',
      targetType: 'User',
      targetId: target.id,
      metadata: { role: target.role },
    },
  });

  res.json({ user: publicUser(target), accessToken });
});

// ---------------------------------------------------------------------------
// Pricing plans
// ---------------------------------------------------------------------------

const listPlans = asyncHandler(async (req, res) => {
  const plans = await prisma.pricingPlan.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { priceMonthly: 'asc' },
  });
  res.json({
    plans: plans.map((p) => ({ ...p, activeSubscribers: p._count.users })),
  });
});

const planSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  priceMonthly: Joi.number().integer().min(0).required(),
  maxGbpAccounts: Joi.number().integer().min(1).required(),
  isAgencyPlan: Joi.boolean().default(false),
  features: Joi.array().items(Joi.string().max(200)).default([]),
  aiReplyQuota: Joi.number().integer().min(0).allow(null),
});

const createPlan = asyncHandler(async (req, res) => {
  const data = validate(planSchema, req.body);
  const plan = await prisma.pricingPlan.create({ data });
  res.status(201).json({ plan });
});

const updatePlan = asyncHandler(async (req, res) => {
  const data = validate(
    planSchema.fork(Object.keys(planSchema.describe().keys), (f) => f.optional()),
    req.body
  );

  const existing = await prisma.pricingPlan.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) throw new ApiError(404, 'Plan not found');

  const plan = await prisma.pricingPlan.update({
    where: { id: req.params.id },
    // Bump the version so a price change is traceable against old subscriptions.
    data: { ...data, version: existing.version + 1 },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'admin.plan_updated',
      targetType: 'PricingPlan',
      targetId: plan.id,
      metadata: { version: plan.version },
    },
  });

  res.json({ plan });
});

const deletePlan = asyncHandler(async (req, res) => {
  const subscribers = await prisma.user.count({ where: { planId: req.params.id } });
  if (subscribers) {
    throw new ApiError(
      409,
      `${subscribers} user(s) are on this plan. Move them before deleting it.`
    );
  }
  await prisma.pricingPlan.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

/** Public — the marketing pricing page reads this without a token. */
const publicPlans = asyncHandler(async (req, res) => {
  const plans = await prisma.pricingPlan.findMany({
    orderBy: { priceMonthly: 'asc' },
  });
  res.json({ plans });
});

const changeOwnPlan = asyncHandler(async (req, res) => {
  const { planId } = validate(
    Joi.object({ planId: Joi.string().uuid().required() }),
    req.body
  );

  const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new ApiError(404, 'Plan not found');

  const owned = await prisma.gbpAccount.count({ where: { ownerUserId: req.user.id } });
  if (owned > plan.maxGbpAccounts) {
    throw new ApiError(
      409,
      `You have ${owned} GBP accounts but ${plan.name} allows ${plan.maxGbpAccounts}. Remove some first.`
    );
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { planId },
  });
  res.json({ user: publicUser(user) });
});

// ---------------------------------------------------------------------------
// Global settings — a single row
// ---------------------------------------------------------------------------

async function loadSettings() {
  const existing = await prisma.globalPlatformSettings.findFirst();
  return existing || prisma.globalPlatformSettings.create({ data: {} });
}

const getSettings = asyncHandler(async (req, res) => {
  res.json({ settings: await loadSettings() });
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = validate(
    Joi.object({
      defaultLlmProvider: Joi.string().valid('anthropic', 'openai', 'google_gemini'),
      defaultModel: Joi.string().trim().max(120),
      platformName: Joi.string().trim().max(120),
      maintenanceMode: Joi.boolean(),
      globalAnnouncement: Joi.string().trim().max(2000).allow('', null),
      systemPromptPreset: Joi.string().trim().max(4000).allow('', null),
      apiRateLimitPerMin: Joi.number().integer().min(1).max(10000),
      gbpSyncIntervalMinutes: Joi.number().integer().min(5).max(1440),
    }),
    req.body
  );

  const current = await loadSettings();
  const settings = await prisma.globalPlatformSettings.update({
    where: { id: current.id },
    data,
  });
  res.json({ settings });
});

/**
 * Restores the demo dataset. Development only — the frontend's
 * `resetToDefaults()` calls this instead of clearing localStorage now that the
 * data lives in Postgres.
 */
const reseed = asyncHandler(async (req, res) => {
  if (env.isProduction) {
    throw new ApiError(403, 'Seeding is disabled in production');
  }
  const { seed } = require('../../prisma/seed');
  const result = await seed();

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'admin.reseeded',
      targetType: 'System',
      targetId: 'seed',
    },
  });

  res.json({ success: true, ...result });
});

const auditLog = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 100, 500),
  });
  res.json({ logs });
});

module.exports = {
  stats,
  listUsers: listByRole('single'),
  listAgencies: listByRole('agency'),
  listAllUsers: listByRole('single', 'agency', 'super_admin'),
  updateUser,
  deleteUser,
  impersonate,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  publicPlans,
  changeOwnPlan,
  getSettings,
  updateSettings,
  auditLog,
  reseed,
};
