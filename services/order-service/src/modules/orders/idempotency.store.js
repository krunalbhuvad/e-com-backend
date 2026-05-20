import { getRedis } from 'shared/redis';
import { env } from '../../config/env.js';

const RESERVATION_TTL_SECONDS = 60;
const RESERVED_SENTINEL = '<reserved>';

const k = (userId, key) => `idem:order:${userId}:${key}`;

export const idempotencyStore = {
  async claim(userId, key) {
    const redis = getRedis();
    const ok = await redis.set(k(userId, key), RESERVED_SENTINEL, 'NX', 'EX', RESERVATION_TTL_SECONDS);
    return ok === 'OK';
  },

  async getStored(userId, key) {
    const v = await getRedis().get(k(userId, key));
    if (v === null) return { state: 'absent' };
    if (v === RESERVED_SENTINEL) return { state: 'reserved' };
    try { return { state: 'completed', response: JSON.parse(v) }; }
    catch { return { state: 'reserved' }; }
  },

  async complete(userId, key, response) {
    await getRedis().set(k(userId, key), JSON.stringify(response), 'EX', env.IDEMPOTENCY_TTL_SECONDS);
  },

  async release(userId, key) {
    await getRedis().del(k(userId, key)).catch(() => {});
  },
};
