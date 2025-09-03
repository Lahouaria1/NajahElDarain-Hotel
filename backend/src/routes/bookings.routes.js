// backend/src/routes/bookings.routes.js
import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import {
  createBooking,
  listBookings,
  updateBooking,
  deleteBooking,
  findConflicts,
} from '../controllers/bookings.controller.js';
import logger from '../utils/logger.js';
// (optional) write limiter to prevent spammy clients
// import rateLimit from 'express-rate-limit';
// const writeLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true });

const router = Router();

// Trace requests hitting this router (use logger, not console)
router.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.originalUrl }, '[BOOKINGS ROUTER]');
  next();
});

// CRUD
router.get('/', authRequired, listBookings);
router.post('/', authRequired, /* writeLimiter, */ createBooking);
router.put('/:id', authRequired, /* writeLimiter, */ updateBooking);
router.delete('/:id', authRequired, /* writeLimiter, */ deleteBooking);

// Debug helper: list overlaps for a given window (Admin only)
router.get('/debug/conflicts', authRequired, requireRole('Admin'), findConflicts);

export default router;
