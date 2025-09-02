// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

import authRoutes     from './routes/auth.routes.js';
import roomRoutes     from './routes/rooms.routes.js';
import bookingRoutes  from './routes/bookings.routes.js';
import usersRoutes    from './routes/users.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// Behind Render/Netlify proxies
app.set('trust proxy', 1);

// ---------- CORS helpers ----------
function parseCorsOrigins(value) {
  if (!value) return true; // reflect request origin (dev-friendly)
  const list = value.split(',').map(s => s.trim()).filter(Boolean);
  if (list.includes('*')) return true;
  return list;
}

const corsOptions = {
  origin: parseCorsOrigins(process.env.CORS_ORIGIN),
  credentials: true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight for all routes

// ---------- Security & core ----------
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ---------- JWT config ----------
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET missing');
  } else {
    console.warn('[WARN] JWT_SECRET missing (dev mode)');
  }
}
if (process.env.JWT_SECRET) {
  app.set('jwtVerify', (token) => jwt.verify(token, process.env.JWT_SECRET));
}

// ---------- Health & root ----------
app.get('/', (_req, res) => res.type('text').send('API is running'));
app.get('/health',  (_req, res) => res.status(200).json({ ok: true }));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

// (Optional) request log while diagnosing; comment out later
// app.use((req, _res, next) => { console.log('[APP]', req.method, req.originalUrl); next(); });

// ---------- Routes ----------
app.use('/api', authRoutes);            // /api/register, /api/login, etc.
app.use('/api/rooms', roomRoutes);      // -> rooms.routes.js should use router.get('/') etc.
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', usersRoutes);

// ---------- 404 & errors ----------
app.use(notFound);
app.use(errorHandler);

export default app;
