import { publish, assertTopology } from 'shared/broker';
import { logger } from 'shared/logger';

const ORDERS_EXCHANGE = 'orders.events';
const STOCK_EXCHANGE = 'stock.events';

export async function ensureExchanges() {
  await assertTopology({ exchange: ORDERS_EXCHANGE });
  await assertTopology({ exchange: STOCK_EXCHANGE });
}

export async function publishOrderCreated(order) {
  try {
    await publish(ORDERS_EXCHANGE, 'order.created', {
      orderId: order._id.toString(),
      userId: order.userId,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      items: order.items,
      createdAt: order.createdAt,
    });
  } catch (err) {
    logger.error('failed to publish order.created', { err: err.message });
  }
}

export async function publishStockReleaseRequested(items, { reason }) {
  await publish(STOCK_EXCHANGE, 'stock.release.requested', { items, reason });
}

export async function publishOrderStatusChanged(order) {
  try {
    await publish(ORDERS_EXCHANGE, 'order.status.changed', {
      orderId: order._id.toString(),
      status: order.status,
      changedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('failed to publish order.status.changed', { err: err.message });
  }
}
