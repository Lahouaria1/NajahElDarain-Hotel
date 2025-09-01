import Redis from 'ioredis';
import logger from '../utils/logger.js';

export let redis = null;

export async function initRedis() {
  try {
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL); // supports rediss://
    } else {
      redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS ? {} : undefined, // enable TLS if set
      });
    }

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error',   (err) => logger.error('Redis error', err));
  } catch (e) {
    logger.error('Redis init error', e);
    redis = null;
  }
}
