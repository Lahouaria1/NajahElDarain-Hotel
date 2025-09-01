// backend/src/routes/bookings.routes.js
import { Router } from 'express';
import { authRequired /*, requireRole */ } from '../middleware/auth.js';
import {
  createBooking,
  listBookings,
  updateBooking,
  deleteBooking,
  findConflicts,
} from '../controllers/bookings.controller.js';

const router = Router();

// (optional) trace requests hitting this router
router.use((req, _res, next) => {
  console.log('[BOOKINGS ROUTER]', req.method, req.originalUrl);
  next();
});

// CRUD
router.get('/', authRequired, listBookings);
router.post('/', authRequired, createBooking);
router.put('/:id', authRequired, updateBooking);
router.delete('/:id', authRequired, deleteBooking);

// Debug helper: list overlaps for a given window
// You can further restrict it to admins only by adding: requireRole('Admin')
router.get('/debug/conflicts', authRequired, findConflicts);

export default router;
