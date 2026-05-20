import { productRepository } from './product.repository.js';
import { cacheAside, invalidate } from '../../utils/cache.js';
import { publish } from 'shared/broker';
import { ConflictError, NotFoundError, ValidationError } from 'shared/errors';
import { v4 as uuid } from 'uuid';

const cacheKeyForProduct = (id) => `product:${id}`;
const cacheKeyForList = () => 'product:list:active';

export const productService = {
  async list() {
    return cacheAside(cacheKeyForList(), async () => {
      return (await productRepository.list({ active: true, limit: 100 })) ?? [];
    });
  },

  async get(id) {
    const cached = await cacheAside(cacheKeyForProduct(id), async () => {
      const doc = await productRepository.findById(id);
      return doc ? doc.toJSON() : null;
    });
    if (!cached) throw new NotFoundError('Product');
    return cached;
  },

  async create(input) {
    const dup = await productRepository.findBySku(input.sku);
    if (dup) throw new ConflictError(`SKU ${input.sku} already exists`);
    const created = await productRepository.create(input);
    await invalidate(cacheKeyForList());
    return created.toJSON();
  },

  async update(id, patch) {
    const updated = await productRepository.updateById(id, patch);
    if (!updated) throw new NotFoundError('Product');
    await Promise.all([
      invalidate(cacheKeyForProduct(id)),
      invalidate(cacheKeyForList()),
    ]);
    await publish('stock.events', 'product.updated', { productId: id }).catch(() => {});
    return updated.toJSON();
  },

  async reserve(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Items array required');
    }
    const reservationId = uuid();
    const reserved = [];
    for (const { productId, quantity } of items) {
      const doc = await productRepository.reserveAtomic(productId, quantity);
      if (!doc) {
        for (const r of reserved) {
          await productRepository.releaseAtomic(r.productId, r.quantity).catch(() => {});
        }
        throw new ConflictError(`Insufficient stock or unknown product: ${productId}`);
      }
      reserved.push({ productId, quantity, snapshot: doc.toJSON() });
    }
    await invalidate(cacheKeyForList());
    for (const r of reserved) await invalidate(cacheKeyForProduct(r.productId));
    return { reservationId, items: reserved.map((r) => ({ productId: r.productId, quantity: r.quantity })) };
  },

  async release(items) {
    if (!Array.isArray(items) || items.length === 0) return { released: 0 };
    let released = 0;
    for (const { productId, quantity } of items) {
      const ok = await productRepository.releaseAtomic(productId, quantity);
      if (ok) released += 1;
    }
    await invalidate(cacheKeyForList());
    for (const it of items) await invalidate(cacheKeyForProduct(it.productId));
    return { released };
  },
};
