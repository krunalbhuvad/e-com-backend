import mongoose from 'mongoose';

export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

export const ALLOWED_TRANSITIONS = Object.freeze({
  PENDING: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  CONFIRMED: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  SHIPPED: [ORDER_STATUS.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
});

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    sku: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    reservationId: { type: String, default: null, index: true },
    idempotencyKey: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: 'orders' },
);

orderSchema.methods.toJSON = function () {
  return this.toObject({ versionKey: false });
};

export const Order = mongoose.model('Order', orderSchema);
