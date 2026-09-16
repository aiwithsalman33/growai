require('dotenv').config();

/**
 * Fails fast on missing required vars rather than surfacing them later as
 * confusing runtime errors (a null JWT secret signs tokens nobody can verify).
 */
function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`
    );
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 4000,

  databaseUrl: required('DATABASE_URL'),

  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',

  // A Secure cookie is only sent over HTTPS, so on a plain-HTTP deployment the
  // browser silently drops the refresh token and sessions die at the access
  // token's expiry. Defaults to on in production; set COOKIE_SECURE=false only
  // when deliberately serving over HTTP.
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : nodeEnv === 'production',

  // 32-byte hex key used to encrypt Google OAuth tokens at rest.
  encryptionKey: process.env.ENCRYPTION_KEY,

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:4000/api/gbp/oauth/callback',

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-5',

  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',

  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 10 * 1024 * 1024,

  schedulerIntervalMs: Number(process.env.SCHEDULER_INTERVAL_MS) || 30000,
  schedulerMaxRetries: Number(process.env.SCHEDULER_MAX_RETRIES) || 3,
};
