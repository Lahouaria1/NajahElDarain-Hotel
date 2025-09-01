// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
// Optional: add a stricter rate limit on just auth routes to mitigate brute force
// import rateLimit from 'express-rate-limit';
// const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

/**
 * Public authentication routes (no JWT required).
 * Mounted in app.js under /api:
 *   app.use('/api', authRoutes)
 */
const router = Router();

// POST /api/register -> create user, return { token, user }
router.post('/register', register);

// POST /api/login -> authenticate, return { token, user }
router.post('/login', login);

export default router;
