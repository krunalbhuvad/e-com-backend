import { registerConsumer } from 'shared/broker';
import { productRepository } from './product.repository.js';
import { logger } from 'shared/logger';

const EXCHANGE = 'stock.events';
const QUEUE = 'product.stock-release.q';
const ROUTING_KEY = 'stock.release.requested';
const DLX = `${EXCHANGE}.dlx`;

export async function registerStockReleaseConsumer() {
  await registerConsumer({
    exchange: EXCHANGE,
    queue: QUEUE,
    routingKey: ROUTING_KEY,
    dlx: DLX,
    async handler(payload) {
      if (!Array.isArray(payload?.items)) {
        throw new Error('invalid stock.release.requested payload');
      }
      for (const item of payload.items) {
        const ok = await productRepository.releaseAtomic(item.productId, item.quantity);
        if (!ok) {
          logger.warn('stock release: skipped (already released or unknown product)', {
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }
      logger.info('stock release: processed', { count: payload.items.length });
    },
  });
}
