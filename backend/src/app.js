import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

import authRoutes     from './routes/auth.routes.js';
import roomRoutes     from './routes/rooms.routes.js';
import bookingRoutes  from './routes/bookings.routes.js'; // <- IMPORTANT: bookings.routes.js
import usersRoutes    from './routes/users.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
app.set('trust proxy', 1);

function parseCorsOrigins(value) {
  if (!value) return true;
  const list = value.split(',').map(s => s.trim()).filter(Boolean);
  if (list.includes('*')) return true;
  return list;
}

app.use(helmet());
app.use(cors({ origin: parseCorsOrigins(process.env.CORS_ORIGIN), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');

app.set('jwtVerify', (token) => jwt.verify(token, process.env.JWT_SECRET));

app.get('/health', (_req, res) => res.json({ ok: true }));

// ---- TEMP DEBUG (keeps only while diagnosing) ----
app.use((req, _res, next) => { console.log('[APP]', req.method, req.originalUrl); next(); });

// ✅ Correct mounts
app.use('/api', authRoutes);            // /api/register, /api/login
app.use('/api/rooms', roomRoutes);      // rooms only
app.use('/api/bookings', bookingRoutes);// bookings only
app.use('/api/users', usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
