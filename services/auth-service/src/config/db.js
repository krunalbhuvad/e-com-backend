import mongoose from 'mongoose';
import { logger } from 'shared/logger';
import { env } from './env.js';

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

export async function connectDb() {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 50,
  });
  logger.info('mongo connected', { db: 'auth_db' });
}

export async function isDbHealthy() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
