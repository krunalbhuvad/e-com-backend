import express from 'express';
import {
  requestIdMiddleware,
  applySecurity,
  errorHandler,
  notFoundHandler,
} from 'shared';
import { corsAllowlist } from './config/env.js';
import { ipLimiter, userLimiter } from './middleware/rate-limit.js';
import healthRouter from './routes/health.js';
import proxyRouter from './routes/proxy.routes.js';

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware());
  applySecurity(app, { corsAllowlist });

  app.use(express.json({ limit: '256kb' }));

  app.use('/health', healthRouter);

  app.use(ipLimiter);
  app.use(userLimiter);

  app.use('/api', proxyRouter);
  app.get('/metrics', (req, res, next) => {
    import('./utils/breaker-registry.js').then(({ getBreakerMetrics }) => {
      res.json({ breakers: getBreakerMetrics() });
    }).catch(next);
  });

  app.use(notFoundHandler());
  app.use(errorHandler());

  return app;
}
