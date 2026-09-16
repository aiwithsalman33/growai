const multer = require('multer');
const logger = require('../config/logger');
const env = require('../config/env');

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wraps an async handler so a rejected promise reaches the error handler. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

function mapKnownError(err) {
  if (err instanceof multer.MulterError) {
    return {
      status: err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large.'
          : `Upload error: ${err.message}`,
    };
  }

  // Prisma errors carry a code; translate the two that are user-facing.
  if (err.code === 'P2002') {
    return { status: 409, message: 'That value is already taken.' };
  }
  if (err.code === 'P2025') {
    return { status: 404, message: 'Record not found.' };
  }

  return null;
}

// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
function errorHandler(err, req, res, next) {
  const known = mapKnownError(err);
  const status = known?.status || err.status || 500;
  const message = known?.message || err.message || 'Internal server error';

  if (status >= 500) {
    logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  } else {
    logger.warn({ status, message, url: req.originalUrl }, 'Request failed');
  }

  res.status(status).json({
    error: status >= 500 && env.isProduction ? 'Internal server error' : message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler, notFound, asyncHandler, ApiError };
