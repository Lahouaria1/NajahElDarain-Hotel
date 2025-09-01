// backend/src/routes/rooms.routes.js
// Router for Room CRUD endpoints. Protects routes with auth and admin checks.

import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import {
  createRoom,
  listRooms,
  updateRoom,
  deleteRoom,
} from '../controllers/rooms.controller.js';

const router = Router();

// TEMP DEBUG: log every request that hits the rooms router (remove in production)
router.use((req, _res, next) => {
  console.log('[ROOMS ROUTER]', req.method, req.originalUrl);
  next();
});

/**
 * GET /api/rooms
 * Anyone logged in can list rooms.
 */
router.get('/', authRequired, listRooms);

/**
 * POST /api/rooms
 * Only Admins can create a room.
 */
router.post('/', authRequired, requireRole('Admin'), createRoom);

/**
 * PUT /api/rooms/:id
 * Only Admins can update a room by id.
 */
router.put('/:id', authRequired, requireRole('Admin'), updateRoom);

/**
 * DELETE /api/rooms/:id
 * Only Admins can delete a room by id.
 */
router.delete('/:id', authRequired, requireRole('Admin'), deleteRoom);

export default router;
