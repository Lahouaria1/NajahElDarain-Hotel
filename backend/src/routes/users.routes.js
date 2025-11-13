// backend/src/routes/users.routes.js
import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import { listUsers, deleteUser } from '../controllers/users.controller.js';

const router = Router();

router.get('/', authRequired, requireRole('Admin'), listUsers);
router.delete('/:id', authRequired, requireRole('Admin'), deleteUser);

export default router;
