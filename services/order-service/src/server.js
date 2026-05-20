import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { connectBroker, closeBroker } from 'shared/broker';
import { getRedis, closeRedis } from 'shared/redis';
import { logger } from 'shared/logger';
import { ensureExchanges } from './modules/orders/order.events.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main() {
  await connectDb();
  getRedis();
  await connectBroker();
  await ensureExchanges();

  const app = createApp();
  const server = app.listen(env.PORT, () => logger.info('order-service listening', { port: env.PORT }));

  const shutdown = (signal) => {
    logger.warn('shutdown signal', { signal });
    const killTimer = setTimeout(() => { logger.error('forced exit'); process.exit(1); }, SHUTDOWN_TIMEOUT_MS);
    server.close(async () => {
      await Promise.allSettled([closeBroker(), closeRedis(), disconnectDb()]);
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
  logger.error('order-service failed to start', { err: err.message, stack: err.stack });
  process.exit(1);
});
