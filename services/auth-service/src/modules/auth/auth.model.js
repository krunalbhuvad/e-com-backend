import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.virtual('password').set(function (plain) {
  this._plainPassword = plain;
});

// hash before validation runs
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, env.BCRYPT_COST);
    this._plainPassword = undefined;
  }
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
