import mongoose from 'mongoose';
import { Product } from './product.model.js';

export const productRepository = {
  list({ active = true, limit = 50, skip = 0 } = {}) {
    return Product.find({ active }).limit(limit).skip(skip).lean();
  },
  findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Product.findById(id);
  },
  findBySku(sku) {
    return Product.findOne({ sku: sku.toUpperCase() });
  },
  create(doc) {
    return Product.create(doc);
  },
  updateById(id, patch) {
    return Product.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
  },

  reserveAtomic(productId, qty) {
    if (!mongoose.isValidObjectId(productId)) return Promise.resolve(null);
    return Product.findOneAndUpdate(
      { _id: productId, active: true, stock: { $gte: qty } },
      { $inc: { stock: -qty, reserved: qty } },
      { new: true },
    );
  },

  releaseAtomic(productId, qty) {
    if (!mongoose.isValidObjectId(productId)) return Promise.resolve(null);
    return Product.findOneAndUpdate(
      { _id: productId, reserved: { $gte: qty } },
      { $inc: { stock: qty, reserved: -qty } },
      { new: true },
    );
  },
};
