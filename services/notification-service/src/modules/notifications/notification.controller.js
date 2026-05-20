import { notificationService } from './notification.service.js';
import { ValidationError } from 'shared/errors';

export const notificationController = {
  async list(req, res, next) {
    try {
      const orderId = req.query.orderId;
      if (!orderId) throw new ValidationError('orderId query parameter required');
      res.json({ items: await notificationService.list(String(orderId)) });
    } catch (err) { next(err); }
  },
};
