import express from 'express';
import { requestIdMiddleware, applySecurity, errorHandler, notFoundHandler } from 'shared';
import { isDbHealthy } from './config/db.js';
import { corsAllowlist } from './config/env.js';
import authRouter from './modules/auth/auth.routes.js';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware());
  applySecurity(app, { corsAllowlist });
  app.use(express.json({ limit: '64kb' }));

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    const db = await isDbHealthy();
    if (!db) return res.status(503).json({ status: 'not ready', db: false });
    res.json({ status: 'ready', db: true });
  });

  app.use('/auth', authRouter);

  app.use(notFoundHandler());
  app.use(errorHandler());
  return app;
}
