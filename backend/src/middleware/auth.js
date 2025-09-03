// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

const BEARER_RE = /^Bearer\s+(.+)$/i;

/** Require a valid JWT in Authorization header */
export function authRequired(req, _res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(BEARER_RE);
  if (!m) return next(createError(401, 'Missing token'));

  try {
    const token = m[1].trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      clockTolerance: 5,
    });

    req.user = {
      id: String(payload.sub),
      role: payload.role,
      username: payload.username,
    };
    next();
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired'));
    }
    next(createError(401, 'Invalid token'));
  }
}

/** RBAC helpers */
export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(createError(403, 'Forbidden'));
    }
    next();
  };
}

export function requireAnyRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, 'Forbidden'));
    }
    next();
  };
}
