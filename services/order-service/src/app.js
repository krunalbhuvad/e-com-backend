import express from 'express';
import { requestIdMiddleware, applySecurity, errorHandler, notFoundHandler } from 'shared';
import { isDbHealthy } from './config/db.js';
import { pingRedis } from 'shared/redis';
import { isBrokerHealthy } from 'shared/broker';
import { getBreakerMetrics } from 'shared/circuit-breaker';
import { corsAllowlist } from './config/env.js';
import orderRouter from './modules/orders/order.routes.js';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware());
  applySecurity(app, { corsAllowlist });
  app.use(express.json({ limit: '256kb' }));

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    const [db, redis, broker] = await Promise.all([isDbHealthy(), pingRedis(), isBrokerHealthy()]);
    const ready = db && redis && broker;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not ready', db, redis, broker });
  });

  app.get('/metrics', (_req, res) => res.json({ breakers: getBreakerMetrics() }));

  app.use('/orders', orderRouter);

  app.use(notFoundHandler());
  app.use(errorHandler());
  return app;
}
