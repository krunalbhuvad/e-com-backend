import { getRedis } from 'shared/redis';
import { env } from '../config/env.js';
import { logger } from 'shared/logger';

const POLL_INTERVAL_MS = 50;
const POLL_MAX_MS = 10_000;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export async function cacheAside(key, fetcher) {
  const redis = getRedis();
  const cached = await redis.get(key);
  if (cached !== null) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }

  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'PX', POLL_MAX_MS);

  if (acquired === 'OK') {
    try {
      const value = await fetcher();
      const payload = value === undefined ? null : value;
      await redis.set(key, JSON.stringify(payload), 'EX', env.PRODUCT_CACHE_TTL_SECONDS);
      return payload;
    } finally {
      await redis.del(lockKey).catch(() => {});
    }
  }

  const start = Date.now();
  while (Date.now() - start < POLL_MAX_MS) {
    await sleep(POLL_INTERVAL_MS);
    const v = await redis.get(key);
    if (v !== null) {
      try { return JSON.parse(v); } catch { /* keep polling */ }
    }
  }

  logger.warn('cache stampede lock timed out, falling back to direct fetch', { key });
  return fetcher();
}

export async function invalidate(key) {
  return getRedis().del(key);
}
