const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * `sub` carries the user id; `role` and `agencyId` are mirrored into the token
 * so middleware/auth.js can authorize without a database round-trip.
 */
function generateTokens(user) {
  const payload = { sub: user.id, role: user.role, agencyId: user.agencyId };

  const accessToken = jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  });
  const refreshToken = jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl,
  });

  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

/** Strips the password hash before a user object crosses the API boundary. */
function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  publicUser,
};
