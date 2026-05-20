import mongoose from 'mongoose';
import { Order } from './order.model.js';

export const orderRepository = {
  create(doc) {
    return Order.create(doc);
  },
  findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Order.findById(id);
  },
  findByUser(userId, { limit = 50, skip = 0 } = {}) {
    return Order.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
  },
  updateStatus(id, status) {
    return Order.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  },
};
