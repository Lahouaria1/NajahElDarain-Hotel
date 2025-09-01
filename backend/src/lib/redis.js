// // Simple Redis bootstrap that safely no-ops if REDIS_URL is missing.
// import { createClient } from 'redis';
// import logger from '../utils/logger.js';

// let client = null;

// export async function initRedis() {
//   const url = process.env.REDIS_URL;
//   if (!url) {
//     logger.info('Redis disabled (no REDIS_URL)');
//     return null;
//   }

//   client = createClient({ url });

//   client.on('error', (err) => logger.error('Redis error', err));
//   client.on('connect', () => logger.info('Redis connecting...'));
//   client.on('ready',   () => logger.info('Redis connected'));

//   await client.connect();
//   return client;
// }

// export function getRedis() {
//   return client; // can be null when disabled
// }
