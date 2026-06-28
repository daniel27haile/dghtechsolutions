const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  resourceId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Resource',
    required: true,
  },
  title:        { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  price:        { type: Number, required: true, min: 0 },
  oldPrice:     { type: Number, default: 0, min: 0 },
  discountPct:  { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },
    items:    [cartItemSchema],
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
