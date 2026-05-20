import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from 'shared/logger';
import { closeRedis } from 'shared/redis';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info('api-gateway listening', { port: env.PORT });
});

async function shutdown(signal) {
  logger.warn('shutdown signal received', { signal });
  const killTimer = setTimeout(() => {
    logger.error('graceful shutdown timed out, force-exiting');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close(async () => {
    try {
      await closeRedis();
    } catch (err) {
      logger.error('error closing redis', { err: err.message });
    }
    clearTimeout(killTimer);
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('uncaught exception', { err: err.message, stack: err.stack });
});
