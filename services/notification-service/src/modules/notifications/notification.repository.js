import { Notification } from './notification.model.js';

export const notificationRepository = {
  insert(doc) {
    return Notification.create(doc);
  },
  findByOrder(orderId) {
    return Notification.find({ orderId }).sort({ createdAt: -1 }).lean();
  },
  exists(orderId, type) {
    return Notification.exists({ orderId, type });
  },
};
