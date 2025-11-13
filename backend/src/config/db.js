// backend/src/config/db.js
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import 'dotenv/config';
import util from 'node:util';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing');

  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', (collection, method, query, doc) => {
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

  mongoose.connection.on('connected', () => logger.info('MongoDB connection established'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

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
