const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verify JWT access token and attach user payload to request.
 * Expected Authorization header: `Bearer <token>`.
 */
function verifyJwt(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid Authorization format' });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    // Attach minimal user info to request
    req.user = { id: payload.sub, role: payload.role, agencyId: payload.agencyId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = verifyJwt;
