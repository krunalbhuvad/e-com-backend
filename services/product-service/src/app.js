import express from 'express';
import { requestIdMiddleware, applySecurity, errorHandler, notFoundHandler } from 'shared';
import { isDbHealthy } from './config/db.js';
import { pingRedis } from 'shared/redis';
import { isBrokerHealthy } from 'shared/broker';
import { corsAllowlist } from './config/env.js';
import productRouter from './modules/products/product.routes.js';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware());
  applySecurity(app, { corsAllowlist });
  app.use(express.json({ limit: '64kb' }));

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    const [db, redis, broker] = await Promise.all([isDbHealthy(), pingRedis(), isBrokerHealthy()]);
    const ready = db && redis && broker;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not ready', db, redis, broker });
  });

  app.use('/products', productRouter);

  app.use(notFoundHandler());
  app.use(errorHandler());
  return app;
}
