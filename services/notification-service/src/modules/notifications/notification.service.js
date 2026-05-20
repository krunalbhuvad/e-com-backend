import { notificationRepository } from './notification.repository.js';
import { logger } from 'shared/logger';

export const notificationService = {
  async recordOrderCreated(event) {
    // dedupe on at-least-once redelivery
    const existing = await notificationRepository.exists(event.orderId, 'order.created');
    if (existing) {
      logger.info('skipping duplicate order.created notification', { orderId: event.orderId });
      return null;
    }
    return notificationRepository.insert({
      orderId: event.orderId,
      userId: event.userId,
      channel: 'inapp',
      type: 'order.created',
      payload: { totalCents: event.totalCents, currency: event.currency, items: event.items },
      status: 'sent',
    });
  },

  list(orderId) {
    return notificationRepository.findByOrder(orderId);
  },
};
