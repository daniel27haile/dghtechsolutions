const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  resourceId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  ownerId:           { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  title:             { type: String, required: true },
  priceAtPurchase:   { type: Number, required: true, min: 0 },
  discountAtPurchase:{ type: Number, default: 0, min: 0 },
  platformFeeRate:   { type: Number, default: 0, min: 0, max: 100 }, // % stored at purchase time
  platformFeeAmount: { type: Number, default: 0, min: 0 },
  publisherNetAmount:{ type: Number, default: 0, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail:       { type: String, default: '' },
    items:           [orderItemSchema],
    couponId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode:      { type: String, default: '' },
    grossAmount:     { type: Number, required: true, min: 0 },
    discountAmount:  { type: Number, default: 0, min: 0 },
    finalAmount:     { type: Number, required: true, min: 0 },
    currency:        { type: String, default: 'USD' },
    paymentStatus:         { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    paymentProvider:       { type: String, default: 'STRIPE' },
    stripeSessionId:       { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    paidAt:                { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'items.ownerId': 1 });
orderSchema.index({ stripeSessionId: 1 });

module.exports = mongoose.model('Order', orderSchema);
