import IORedis from 'ioredis';
import { logger } from './logger.js';

let client = null;

export function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');

  client = new IORedis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    reconnectOnError(err) {
      const targetError = 'READONLY';
      return err.message.includes(targetError);
    },
  });

  client.on('connect', () => logger.info('redis connected'));
  client.on('error', (err) => logger.error('redis error', { err: err.message }));
  client.on('close', () => logger.warn('redis connection closed'));

  return client;
}

export async function pingRedis() {
  try {
    const pong = await getRedis().ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
