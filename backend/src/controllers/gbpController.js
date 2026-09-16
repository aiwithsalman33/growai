const Joi = require('joi');
const prisma = require('../config/db');
const env = require('../config/env');
const gbpService = require('../services/gbpService');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const accountSchema = Joi.object({
  locationName: Joi.string().trim().min(2).max(200).required(),
  clientLabel: Joi.string().trim().max(200).allow('', null),
  googleAccountId: Joi.string().trim().max(200).allow('', null),
  googleLocationId: Joi.string().trim().max(200).allow('', null),
  address: Joi.string().trim().max(400).allow('', null),
  phone: Joi.string().trim().max(40).allow('', null),
  website: Joi.string().trim().max(400).allow('', null),
  placeId: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(120).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  openingHours: Joi.any(),
});

// Same fields, all optional — built once rather than per request.
const accountUpdateSchema = accountSchema.fork(
  Object.keys(accountSchema.describe().keys),
  (field) => field.optional()
);

/** Never let encrypted OAuth material reach the client. */
function present(account) {
  const { accessTokenEnc, refreshTokenEnc, ...rest } = account;
  return rest;
}

const list = asyncHandler(async (req, res) => {
  const where = req.user.role === 'super_admin' ? {} : { ownerUserId: req.user.id };
  const accounts = await prisma.gbpAccount.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ accounts: accounts.map(present) });
});

const getOne = asyncHandler(async (req, res) => {
  res.json({ account: present(req.gbpAccount) });
});

/**
 * Creates the account row before OAuth. The Google tokens are attached later by
 * the callback, which is why they are nullable on the model.
 */
const create = asyncHandler(async (req, res) => {
  const { value, error } = accountSchema.validate(req.body, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }

  const plan = req.user.role === 'super_admin'
    ? null
    : await planFor(req.user.id);
  if (plan) await assertUnderPlanLimit(req.user.id, plan);

  const account = await prisma.gbpAccount.create({
    data: {
      ...value,
      googleAccountId: value.googleAccountId || '',
      googleLocationId: value.googleLocationId || '',
      ownerUserId: req.user.id,
      connected: false,
    },
  });

  res.status(201).json({ account: present(account) });
});

async function planFor(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
  return user?.plan || null;
}

async function assertUnderPlanLimit(userId, plan) {
  const count = await prisma.gbpAccount.count({ where: { ownerUserId: userId } });
  if (count >= plan.maxGbpAccounts) {
    throw new ApiError(
      402,
      `Your ${plan.name} plan allows ${plan.maxGbpAccounts} GBP account(s). Upgrade to add more.`
    );
  }
}

const update = asyncHandler(async (req, res) => {
  const { value, error } = accountUpdateSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    throw new ApiError(400, 'Validation failed', error.details.map((d) => d.message));
  }

  const account = await prisma.gbpAccount.update({
    where: { id: req.gbpAccount.id },
    data: value,
  });
  res.json({ account: present(account) });
});

const disconnect = asyncHandler(async (req, res) => {
  const account = await prisma.gbpAccount.update({
    where: { id: req.gbpAccount.id },
    data: {
      connected: false,
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: req.user.id,
      action: 'gbp.disconnected',
      targetType: 'GbpAccount',
      targetId: account.id,
    },
  });

  res.json({ account: present(account) });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.gbpAccount.delete({ where: { id: req.gbpAccount.id } });
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/** Returns the Google consent URL; the SPA redirects the browser to it. */
const oauthStart = asyncHandler(async (req, res) => {
  if (!gbpService.isConfigured()) {
    throw new ApiError(
      503,
      'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
  }
  // State binds the callback to this user and this account row.
  const state = Buffer.from(
    JSON.stringify({ userId: req.user.id, accountId: req.gbpAccount.id })
  ).toString('base64url');

  res.json({ url: gbpService.getAuthUrl(state) });
});

/**
 * Google redirects the browser here. Ends in a redirect back into the SPA
 * rather than a JSON response, because a human is looking at this page.
 */
const oauthCallback = asyncHandler(async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const settingsUrl = `${env.frontendOrigin}/user/settings/gbp`;

  if (oauthError) {
    return res.redirect(`${settingsUrl}?connected=0&reason=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return res.redirect(`${settingsUrl}?connected=0&reason=missing_code`);
  }

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));
  } catch {
    return res.redirect(`${settingsUrl}?connected=0&reason=bad_state`);
  }

  const account = await prisma.gbpAccount.findUnique({
    where: { id: parsed.accountId },
  });
  if (!account || account.ownerUserId !== parsed.userId) {
    return res.redirect(`${settingsUrl}?connected=0&reason=unknown_account`);
  }

  const tokens = await gbpService.exchangeCode(String(code));

  await prisma.gbpAccount.update({
    where: { id: account.id },
    data: { ...tokens, connected: true, connectedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: parsed.userId,
      action: 'gbp.connected',
      targetType: 'GbpAccount',
      targetId: account.id,
    },
  });

  res.redirect(`${settingsUrl}?connected=1`);
});

/** Pulls locations from Google so the user can confirm what is linked. */
const listGoogleLocations = asyncHandler(async (req, res) => {
  if (!req.gbpAccount.connected) {
    throw new ApiError(409, 'Connect this account to Google first');
  }
  const locations = await gbpService.listLocations(req.gbpAccount);
  res.json({ locations });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  disconnect,
  remove,
  oauthStart,
  oauthCallback,
  listGoogleLocations,
};
