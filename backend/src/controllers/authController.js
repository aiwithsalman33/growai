const Joi = require('joi');
const prisma = require('../config/db');
const env = require('../config/env');
const {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  publicUser,
} = require('../services/tokenService');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

const REFRESH_COOKIE = 'refresh_token';

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(8).max(200).required(),
  companyName: Joi.string().trim().max(200).allow('', null),
  phone: Joi.string().trim().max(40).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function validate(schema, payload) {
  const { value, error } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(
      400,
      'Validation failed',
      error.details.map((d) => d.message)
    );
  }
  return value;
}

/**
 * The portal a user signs in through must match the role on their account.
 * Mirrors the frontend's strict portal isolation, but enforced server-side —
 * the error names the correct portal so the UI can point them at it.
 */
const PORTAL_FOR_ROLE = {
  single: '/login/user',
  agency: '/login/agency',
  super_admin: '/login/admin',
};

/** Signup is only open to the two tenant roles; admins are provisioned. */
function signup(role) {
  return asyncHandler(async (req, res) => {
    const data = validate(signupSchema, req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ApiError(409, 'Email already in use');

    const defaultPlan = await prisma.pricingPlan.findFirst({
      where: { isAgencyPlan: role === 'agency' },
      orderBy: { priceMonthly: 'asc' },
    });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        role,
        companyName: data.companyName || null,
        phone: data.phone || null,
        planId: defaultPlan?.id || null,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user: publicUser(user), accessToken });
  });
}

function login(expectedRole) {
  return asyncHandler(async (req, res) => {
    const data = validate(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    // Same response whether the email is unknown or the password is wrong —
    // otherwise this endpoint enumerates registered accounts.
    const valid = user && (await comparePassword(data.password, user.passwordHash));
    if (!valid) throw new ApiError(401, 'Invalid email or password');

    if (user.role !== expectedRole) {
      throw new ApiError(
        403,
        `This account signs in through ${PORTAL_FOR_ROLE[user.role]}.`
      );
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    res.json({ user: publicUser(user), accessToken });
  });
}

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new ApiError(401, 'No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Refresh token is invalid or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new ApiError(401, 'User no longer exists');

  const { accessToken, refreshToken } = generateTokens(user);
  setRefreshCookie(res, refreshToken);

  res.json({ user: publicUser(user), accessToken });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { plan: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: publicUser(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(120),
    phone: Joi.string().trim().max(40).allow('', null),
    companyName: Joi.string().trim().max(200).allow('', null),
    avatarUrl: Joi.string().trim().max(1000).allow('', null),
  });
  const data = validate(schema, req.body);

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: publicUser(user) });
});

module.exports = { signup, login, refresh, logout, me, updateProfile };
