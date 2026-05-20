import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    channel: { type: String, enum: ['email', 'sms', 'inapp'], default: 'inapp' },
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'sent' },
    deliveredAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ orderId: 1, createdAt: -1 });

notificationSchema.methods.toJSON = function () { return this.toObject({ versionKey: false }); };

export const Notification = mongoose.model('Notification', notificationSchema);
