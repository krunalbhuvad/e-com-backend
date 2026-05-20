import express from 'express';
import axios from 'axios';
import { pingRedis } from 'shared/redis';
import { env } from '../config/env.js';

const router = express.Router();

router.get('/live', (_req, res) => res.json({ status: 'live' }));

router.get('/ready', async (_req, res) => {
  const redisOk = await pingRedis();
  if (!redisOk) return res.status(503).json({ status: 'not ready', redis: false });
  res.json({ status: 'ready', redis: true });
});

const downstream = {
  auth: env.AUTH_SERVICE_URL,
  products: env.PRODUCT_SERVICE_URL,
  orders: env.ORDER_SERVICE_URL,
  notifications: env.NOTIFICATION_SERVICE_URL,
};

router.get('/', async (_req, res) => {
  const checks = await Promise.allSettled(
    Object.entries(downstream).map(async ([name, base]) => {
      const { data, status } = await axios.get(`${base}/health/ready`, {
        timeout: 1500,
        validateStatus: () => true,
      });
      return { name, status, body: data };
    }),
  );
  const results = checks.map((r, i) => {
    const name = Object.keys(downstream)[i];
    if (r.status === 'fulfilled') {
      return { name, ready: r.value.status === 200, ...r.value.body };
    }
    return { name, ready: false, error: r.reason?.message ?? 'unknown' };
  });
  const allReady = results.every((r) => r.ready);
  res.status(allReady ? 200 : 503).json({
    gateway: 'ready',
    services: results,
  });
});

export default router;
