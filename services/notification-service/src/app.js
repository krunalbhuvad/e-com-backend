import express from 'express';
import { requestIdMiddleware, applySecurity, errorHandler, notFoundHandler } from 'shared';
import { isDbHealthy } from './config/db.js';
import { isBrokerHealthy } from 'shared/broker';
import { corsAllowlist } from './config/env.js';
import notificationRouter from './modules/notifications/notification.routes.js';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware());
  applySecurity(app, { corsAllowlist });
  app.use(express.json({ limit: '64kb' }));

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    const [db, broker] = await Promise.all([isDbHealthy(), isBrokerHealthy()]);
    const ready = db && broker;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not ready', db, broker });
  });

  app.use('/notifications', notificationRouter);

  app.use(notFoundHandler());
  app.use(errorHandler());
  return app;
}
