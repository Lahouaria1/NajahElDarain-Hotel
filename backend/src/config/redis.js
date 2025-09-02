// src/config/redis.js
import Redis from "ioredis";
import logger from "../utils/logger.js";

export let redis = null;

export async function initRedis() {
  try {
    // Prefer single URL (works with Upstash)
    const url = process.env.REDIS_URL;

    if (url) {
      const needsTLS = url.startsWith("rediss://");
      redis = new Redis(url, {
        // Upstash-friendly options
        tls: needsTLS ? {} : undefined,
        maxRetriesPerRequest: null,   // avoid request timeouts during reconnects
        enableReadyCheck: false,      // Upstash doesn't require INFO on startup
        reconnectOnError: () => true, // always try to recover
        // optional: longer socket keepalive for free tier sleeps
        keepAlive: 30_000,
        connectTimeout: 20_000,
      });
    } else {
      const tls = process.env.REDIS_TLS ? {} : undefined;
      redis = new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD,
        tls,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        reconnectOnError: () => true,
        keepAlive: 30_000,
        connectTimeout: 20_000,
      });
    }

    redis.on("connect",   () => logger.info("Redis connected"));
    redis.on("ready",     () => logger.info("Redis ready"));
    redis.on("reconnecting", () => logger.warn("Redis reconnecting…"));
    redis.on("end",       () => logger.warn("Redis connection ended"));
    redis.on("error",     (err) => logger.error("Redis error", err));
  } catch (e) {
    logger.error("Redis init error", e);
    redis = null; // don't crash the app
  }
}
