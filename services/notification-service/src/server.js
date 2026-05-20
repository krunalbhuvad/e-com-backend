import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { connectBroker, closeBroker } from 'shared/broker';
import { logger } from 'shared/logger';
import { startOrderCreatedConsumer } from './modules/notifications/notification.consumer.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  await connectDb();
  await connectBroker();
  await startOrderCreatedConsumer();

  const app = createApp();
  const server = app.listen(env.PORT, () => logger.info('notification-service listening', { port: env.PORT }));

  const shutdown = (signal) => {
    logger.warn('shutdown signal', { signal });
    const killTimer = setTimeout(() => { logger.error('forced exit'); process.exit(1); }, SHUTDOWN_TIMEOUT_MS);
    server.close(async () => {
      await Promise.allSettled([closeBroker(), disconnectDb()]);
      clearTimeout(killTimer);
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (r) => logger.error('unhandledRejection', { reason: String(r) }));
  process.on('uncaughtException', (e) => logger.error('uncaughtException', { err: e.message }));
}

main().catch((err) => {
  logger.error('notification-service failed to start', { err: err.message, stack: err.stack });
  process.exit(1);
});
