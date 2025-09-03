// backend/src/middleware/errors.js
import logger from '../utils/logger.js';

/**
 * notFound
 * ----------------------------------------------------
 * Catch-all for unmatched routes. Forward a 404 error
 * to the centralized error handler below.
 *
 * Usage in app.js (AFTER all routes):
 *   app.use(notFound);
 */
export function notFound(req, _res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

/**
 * errorHandler
 * ----------------------------------------------------
 * Central error handler that:
 * - Maps common Mongoose/JWT/body-parser errors to
 *   consistent HTTP status codes and messages
 * - Logs 5xx errors
 * - Returns JSON: { error, ...debug in non-prod }
 *
 * Keep this as the very last middleware:
 *   app.use(errorHandler);
 */
export function errorHandler(err, req, res, _next) {
  // Defaults
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  // ---- Normalize common error shapes ----

  // Mongoose validation error (required, min/max, enum, etc.)
  if (err.name === 'ValidationError') {
    status = 400;
    message =
      Object.values(err.errors || {})
        .map((e) => e.message)
        .join(', ') || 'Validation error';
  }

  // Invalid ObjectId cast (e.g., /:id not a valid ObjectId)
  if (err.name === 'CastError' && (err.kind === 'ObjectId' || err.path === '_id')) {
    status = 400;
    message = `Invalid id: ${err.value}`;
  }

  // Mongo duplicate key error (unique index collisions)
  if (err.code === 11000) {
    status = 400;
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    message = fields.length
      ? `Duplicate value for: ${fields.join(', ')}`
      : 'Duplicate key error';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // body-parser JSON parse error
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON';
  }

  // ---- Logging ----
  if (status >= 500) {
    // Server-side issue
    logger.error(err);
  } else {
    // Useful to see noisy client-side issues during dev
    logger.warn(`${status} ${message}`);
  }

  // ---- Response ----
  const payload = { error: message };

  // Include a bit more context outside production
  if (process.env.NODE_ENV !== 'production') {
    payload.status = status;
    payload.path = req.originalUrl;
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}
