import { orderRepository } from './order.repository.js';
import { idempotencyStore } from './idempotency.store.js';
import { productClient } from '../../clients/product.client.js';
import { publishOrderCreated, publishStockReleaseRequested, publishOrderStatusChanged } from './order.events.js';
import { Order, ORDER_STATUS, ALLOWED_TRANSITIONS } from './order.model.js';
import { ConflictError, NotFoundError, ForbiddenError, ValidationError } from 'shared/errors';
import { logger } from 'shared/logger';

export const orderService = {
  async createOrder({ user, idempotencyKey, bearerToken, payload }) {
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency-Key header is required for POST /orders');
    }

    const claimed = await idempotencyStore.claim(user.id, idempotencyKey);
    if (!claimed) {
      const stored = await idempotencyStore.getStored(user.id, idempotencyKey);
      if (stored.state === 'completed') {
        return { isReplay: true, body: stored.response };
      }
      if (stored.state === 'reserved') {
        throw new ConflictError('A request with this Idempotency-Key is already in progress');
      }
    }

    let reservation;
    try {
      reservation = await productClient.reserve(payload.items, bearerToken);

      const items = reservation.items.map((r) => {
        const req = payload.items.find((i) => i.productId === r.productId);
        return {
          productId: r.productId,
          quantity: r.quantity,
          unitPriceCents: req?.unitPriceCents ?? 0,
        };
      });
      const totalCents = items.reduce((acc, it) => acc + it.unitPriceCents * it.quantity, 0);

      const order = await orderRepository.create({
        userId: user.id,
        status: ORDER_STATUS.PENDING,
        items,
        totalCents,
        currency: payload.currency ?? 'USD',
        reservationId: reservation.reservationId,
        idempotencyKey,
      });

      await publishOrderCreated(order);

      const responseBody = { status: 201, body: order.toJSON() };
      await idempotencyStore.complete(user.id, idempotencyKey, responseBody);
      return { isReplay: false, body: responseBody.body };
    } catch (err) {
      // compensation: release stock if we had already reserved
      if (reservation?.items?.length) {
        await publishStockReleaseRequested(reservation.items, {
          reason: `order persistence failed: ${err.message}`,
        }).catch((pubErr) => logger.error('failed to publish compensation', { err: pubErr.message }));
      }
      await idempotencyStore.release(user.id, idempotencyKey);
      throw err;
    }
  },

  async getOrder(user, orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    // return 404 to non-owners to avoid leaking existence
    if (user.role !== 'admin' && order.userId !== user.id) {
      throw new NotFoundError('Order');
    }
    return order.toJSON();
  },

  async listMine(user) {
    return orderRepository.findByUser(user.id);
  },

  async changeStatus(user, orderId, nextStatus) {
    if (user.role !== 'admin') throw new ForbiddenError('Only admins can change order status');
    if (!Object.values(ORDER_STATUS).includes(nextStatus)) {
      throw new ValidationError(`Unknown status ${nextStatus}`);
    }
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictError(`Cannot transition from ${order.status} to ${nextStatus}`);
    }
    const updated = await orderRepository.updateStatus(orderId, nextStatus);
    await publishOrderStatusChanged(updated);
    return updated.toJSON();
  },
};
