const rateLimit = require('express-rate-limit');

const json = (message) => (req, res) => res.status(429).json({ error: message });

/** Broad ceiling on the whole API. */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_PER_MIN) || 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Too many requests — slow down.'),
});

/** Credential endpoints get a much tighter budget to blunt brute force. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  handler: json('Too many authentication attempts. Try again later.'),
});

/** AI generation is the expensive path — per-user, not per-IP. */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AI_RATE_LIMIT_PER_MIN) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: json('AI reply limit reached. Try again in a minute.'),
});

module.exports = { globalLimiter, authLimiter, aiLimiter };
