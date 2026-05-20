import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    parentJti: { type: String, default: null },
  },
  { timestamps: true, collection: 'refresh_tokens' },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
