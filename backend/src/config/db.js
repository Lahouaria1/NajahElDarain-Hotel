// backend/src/config/db.js
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import 'dotenv/config';

/**
 * Connect to MongoDB using Mongoose.
 *
 * Requires env var:
 *   MONGO_URI = mongodb://localhost:27017/cowork_bookings_najah
 *   // or inside Docker Compose network:
 *   // MONGO_URI = mongodb://mongo:27017/cowork_bookings_najah
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    // Fail fast if no connection string is provided
    throw new Error('MONGO_URI missing');
  }

  // Optional: enable stricter query casting (good for catching typos)
  // mongoose.set('strictQuery', true);

  // Optional: log MongoDB operations in development to help debugging
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collection, method, query, doc, options) => {
      const parts = [
        `Mongoose: ${collection}.${method}`,
        JSON.stringify(query),
        doc ? JSON.stringify(doc) : '',
        options ? JSON.stringify(options) : '',
      ].filter(Boolean);
      logger.debug(parts.join(' '));
    });
  }

  try {
    // Connect to the database. You can pass options here if needed.
    // Example: await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (err) {
    // Initial connection failed — log and rethrow so the app can exit
    logger.error('MongoDB initial connection error', err);
    throw err;
  }

  // Useful connection lifecycle logs
  mongoose.connection.on('connected', () => logger.info('MongoDB connection established'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  // Graceful shutdown: close DB connection on process signals
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

  process.once('SIGINT', () => close('SIGINT'));  // Ctrl+C locally
  process.once('SIGTERM', () => close('SIGTERM')); // e.g. platform shutdown
}
