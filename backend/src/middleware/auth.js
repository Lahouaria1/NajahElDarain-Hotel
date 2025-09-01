// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import createError from 'http-errors';

/**
 * authRequired
 * ---------------------------------------------
 * Protects routes by requiring a valid JWT.
 * - Expects header: "Authorization: Bearer <token>"
 * - Verifies token using JWT_SECRET
 * - On success: attaches { id, role, username } to req.user
 * - On failure: forwards 401 (invalid/missing/expired token)
 */
export function authRequired(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(createError(401, 'Missing token'));
  }

  try {
    const token = header.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

    // Tokens are signed with { sub, username, role }
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

/**
 * requireRole('Admin')
 * ---------------------------------------------
 * Role-based guard. Use AFTER authRequired.
 * Example:
 *   router.post('/rooms', authRequired, requireRole('Admin'), createRoom)
 */
export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(createError(403, 'Forbidden'));
    }
    next();
  };
}

/**
 * requireAnyRole('Admin', 'Manager')  (Optional helper)
 * ---------------------------------------------
 * Allows any of the provided roles. Use AFTER authRequired.
 */
export function requireAnyRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, 'Forbidden'));
    }
    next();
  };
}
