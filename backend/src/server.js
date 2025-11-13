// src/server.js
import 'dotenv/config';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { setIO } from './sockets/io.js';
import logger from './utils/logger.js';

const PORT = Number(process.env.PORT) || 4000;

function parseCorsOrigins(value) {
  if (!value) return true;
  const list = value.split(',').map(origin => origin.trim()).filter(Boolean);
  if (list.includes('*')) return true;
  return list;
}

async function start() {
  await connectDB();

  const redis = await initRedis();

  await redis.set('heartbeat', Date.now().toString(), 'EX', 60 * 60 * 24 * 7);

  const SIX_DAYS = 1000 * 60 * 60 * 24 * 6;
  const heartbeat = setInterval(async () => {
    try {
      await redis.set('heartbeat', Date.now().toString(), 'EX', 60 * 60 * 24 * 7);
    } catch (e) {
      logger.warn(`Heartbeat failed: ${e?.message || e}`);
    }
  }, SIX_DAYS);

  const server = http.createServer(app);
  const io = new IOServer(server, {
    cors: { origin: parseCorsOrigins(process.env.CORS_ORIGIN), credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next();
    try {
      const verify = app.get('jwtVerify');
      const payload = verify(token);
      socket.user = { id: payload.sub, role: payload.role, username: payload.username };
      socket.join(payload.sub);
      if (payload.role === 'Admin') socket.join('admins');
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected ${socket.id}${socket.user ? ' user:' + socket.user.id : ''}`);
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected ${socket.id} (${reason})`);
    });
  });

  setIO(io);

  server.listen(PORT, () => logger.info(`API ready on :${PORT}`));

  const shutdown = (sig) => {
    logger.info(`${sig} received, shutting down...`);
    try { io.close(); } catch {}
    clearInterval(heartbeat);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => logger.error('UnhandledRejection', err));
  process.on('uncaughtException',  (err) => logger.error('UncaughtException', err));
}

start().catch((e) => {
  logger.error(e);
  process.exit(1);
});
