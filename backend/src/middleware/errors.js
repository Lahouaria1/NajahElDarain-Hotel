// backend/src/middleware/errors.js
import logger from '../utils/logger.js';

// 404 för rutter som inte matchar – placeras efter alla routes
export function notFound(req, _res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

// Central felhanterare – placeras sist: app.use(errorHandler)
export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message =
      Object.values(err.errors || {})
        .map((e) => e.message)
        .join(', ') || 'Validation error';
  }

  // Ogiltigt ObjectId
  if (err.name === 'CastError' && (err.kind === 'ObjectId' || err.path === '_id')) {
    status = 400;
    message = `Invalid id: ${err.value}`;
  }

  // Duplicerat fält (unique-index)
  if (err.code === 11000) {
    status = 400;
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    message = fields.length
      ? `Duplicate value for: ${fields.join(', ')}`
      : 'Duplicate key error';
  }

  // JWT-fel
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Body-parser JSON parse error
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON';
  }

  // Logga
  if (status >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${status} ${message}`);
  }

  // Svar
  const payload = { error: message };
  if (process.env.NODE_ENV !== 'production') {
    payload.status = status;
    payload.path = req.originalUrl;
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}
