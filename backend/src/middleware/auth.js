const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ApiError } = require('./errorHandler');

function readToken(req) {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) return token;
    throw new ApiError(401, 'Invalid Authorization format — expected "Bearer <token>"');
  }
  // Falls back to the cookie so a page load can authenticate before JS runs.
  return req.cookies?.access_token || null;
}

/**
 * Verifies the access token and attaches the caller to `req.user`.
 * Role and agencyId ride in the token so authorization needs no DB round-trip.
 */
function verifyJwt(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');

    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = { id: payload.sub, role: payload.role, agencyId: payload.agencyId };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/** Populates `req.user` when a valid token is present, but never rejects. */
function optionalAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (token) {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      req.user = { id: payload.sub, role: payload.role, agencyId: payload.agencyId };
    }
  } catch {
    // An unauthenticated caller is fine here.
  }
  next();
}

module.exports = { verifyJwt, optionalAuth };
