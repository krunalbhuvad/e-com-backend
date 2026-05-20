import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    priceCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, length: 3 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reserved: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'products' },
);

productSchema.methods.toJSON = function () {
  return this.toObject({ versionKey: false });
};

export const Product = mongoose.model('Product', productSchema);
