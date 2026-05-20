import { registerConsumer } from 'shared/broker';
import { notificationService } from './notification.service.js';
import { logger } from 'shared/logger';

const EXCHANGE = 'orders.events';
const QUEUE = 'notification.order-created.q';
const ROUTING_KEY = 'order.created';
const DLX = `${EXCHANGE}.dlx`;

export async function startOrderCreatedConsumer() {
  await registerConsumer({
    exchange: EXCHANGE,
    queue: QUEUE,
    routingKey: ROUTING_KEY,
    dlx: DLX,
    async handler(payload, { headers }) {
      if (headers?.['x-simulate-failure']) {
        throw new Error('simulated handler failure for DLQ demo');
      }
      if (!payload?.orderId || !payload?.userId) {
        throw new Error('invalid order.created payload');
      }
      const persisted = await notificationService.recordOrderCreated(payload);
      logger.info('notification logged', {
        orderId: payload.orderId,
        skipped: persisted === null,
      });
    },
  });
}
