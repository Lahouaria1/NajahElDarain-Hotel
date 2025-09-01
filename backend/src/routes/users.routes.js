// backend/src/routes/users.routes.js
import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { listUsers, deleteUser } from '../controllers/users.controller.js';

/**
 * User admin routes
 *
 * Policy:
 *  - All routes require a valid JWT (authRequired).
 *  - Only Admins may access these routes (requireRole('Admin')).
 *
 * Endpoints:
 *  GET    /api/users            → list all users (password excluded)
 *  DELETE /api/users/:id        → delete a user by id
 *                                 (also deletes the user's bookings in controller)
 */
const router = Router();

// List all users (Admin only)
router.get('/', authRequired, requireRole('Admin'), listUsers);

// Delete a specific user (Admin only)
router.delete('/:id', authRequired, requireRole('Admin'), deleteUser);

export default router;
