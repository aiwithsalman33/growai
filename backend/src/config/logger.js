const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: process.env.LOG_LEVEL || (env.isProduction ? 'info' : 'debug'),
  // Never let a token or password reach the log sink.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
      '*.accessTokenEnc',
      '*.refreshTokenEnc',
    ],
    censor: '[redacted]',
  },
});

module.exports = logger;
