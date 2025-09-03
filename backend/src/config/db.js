// backend/src/config/db.js
// Connects to MongoDB and sets up useful dev logging (safe for circular objects).

import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import 'dotenv/config';
import util from 'node:util'; // ✅ for safe logging instead of JSON.stringify

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing');

  // Optional: stricter query casting
  // mongoose.set('strictQuery', true);

  // ✅ Safe Mongoose debug logger (no circular JSON errors)
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collection, method, query, doc /*, options */) => {
      const q = util.inspect(query, { depth: 4, colors: false });
      const d = doc ? util.inspect(doc, { depth: 2, colors: false }) : '';
      logger.debug(`Mongoose: ${collection}.${method} ${q} ${d}`.trim());
    });
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB initial connection error', err);
    throw err;
  }

  // Connection lifecycle logs
  mongoose.connection.on('connected', () => logger.info('MongoDB connection established'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  // Graceful shutdown
  const close = async (signal) => {
    try {
      logger.info(`${signal} received: closing MongoDB connection…`);
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (e) {
      logger.error('Error while closing MongoDB connection', e);
      process.exit(1);
    }
  };
  process.once('SIGINT', () => close('SIGINT'));
  process.once('SIGTERM', () => close('SIGTERM'));
}
