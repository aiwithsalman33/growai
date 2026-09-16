const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/db');
const routes = require('./routes');
const scheduler = require('./services/schedulerService');
const { UPLOAD_ROOT } = require('./services/uploadService');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// Behind nginx in production — without this, rate limiting keys every request
// to the proxy's IP instead of the real client.
app.set('trust proxy', 1);

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true, // the refresh token travels as an httpOnly cookie
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uploaded media lives on the `uploads_data` volume, served straight from disk.
app.use(
  '/uploads',
  express.static(UPLOAD_ROOT, { maxAge: '7d', fallthrough: true })
);

app.use('/api', globalLimiter, routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await prisma.$connect();
  logger.info('Connected to PostgreSQL');

  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, env: env.nodeEnv, uploads: UPLOAD_ROOT },
      'Partner.ai API listening'
    );
  });

  scheduler.start();

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    scheduler.stop();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Don't hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

// Importing this file in a test should not open a port.
if (require.main === module) {
  start().catch((err) => {
    logger.error({ err: err.message }, 'Failed to start server');
    process.exit(1);
  });
}

module.exports = { app, start };
