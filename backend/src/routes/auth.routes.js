// backend/src/routes/auth.routes.js
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

// You can add a dedicated rate limit here if needed
// import rateLimit from 'express-rate-limit';
// const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

const router = Router();

router.post('/register', /* authLimiter, */ register);
router.post('/login',    /* authLimiter, */ login);

export default router;
