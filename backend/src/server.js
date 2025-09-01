// src/server.js
import 'dotenv/config';               // load .env variables
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';           // Express app (routes/middleware)
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { setIO } from './sockets/io.js';
import logger from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4000;

/**
 * Parse CORS origins from env (comma-separated).
 * - undefined/empty → allow request origin (dev-friendly)
 * - includes "*"    → allow any origin
 * - else            → allow only provided list
 */
function parseCorsOrigins(value) {
  if (!value) return true; // reflect request origin
  const list = value.split(',').map(s => s.trim()).filter(Boolean);
  if (list.includes('*')) return true;
  return list;
}

async function start() {
  // 1) Connect to infrastructure
  await connectDB();   // MongoDB
  await initRedis();   // Redis (optional, app works without)

  // 2) Create HTTP server + attach Socket.IO
  const server = http.createServer(app);
  const io = new IOServer(server, {
    cors: {
      origin: parseCorsOrigins(process.env.CORS_ORIGIN),
      credentials: true,
    },
  });

  // Optional: JWT auth for sockets (non-blocking).
  // Frontend passes token: io(BASE_URL, { auth: { token } })
  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(); // allow anonymous socket (no rooms attached)
    try {
      const verify = app.get('jwtVerify'); // function set in app.js
      const payload = verify(token);       // { sub, role, username, ... }

      // Attach minimal user info to socket
      socket.user = {
        id: payload.sub,
        role: payload.role,
        username: payload.username,
      };

      // Join private user room and admin broadcast room
      socket.join(payload.sub);
      if (payload.role === 'Admin') socket.join('admins');

      next();
    } catch {
      // If token invalid, still allow connection (no identity/rooms)
      next();
    }
  });

  // Basic connection logging
  io.on('connection', (socket) => {
    logger.info(`Socket connected ${socket.id}${socket.user ? ' user:' + socket.user.id : ''}`);
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected ${socket.id} (${reason})`);
    });
  });

  // Make io instance available to controllers (e.g., to emit events)
  setIO(io);

  // 3) Start HTTP server
  server.listen(PORT, () => logger.info(`API ready on :${PORT}`));

  // 4) Graceful shutdown (CTRL+C, platform stop)
  const shutdown = (sig) => {
    logger.info(`${sig} received, shutting down...`);
    try { io.close(); } catch {}
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force-exit if something hangs
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Safety nets for unexpected errors
  process.on('unhandledRejection', (err) => logger.error('UnhandledRejection', err));
  process.on('uncaughtException',  (err) => logger.error('UncaughtException', err));
}

// Boot the server
start().catch((e) => {
  logger.error(e);
  process.exit(1);
});
