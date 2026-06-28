const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type:      String,
      required:  [true, 'Coupon code is required'],
      unique:    true,
      trim:      true,
      uppercase: true,
      maxlength: [50, 'Code cannot exceed 50 characters'],
    },
    discountType: {
      type:     String,
      required: true,
      enum:     ['percentage', 'fixed'],
    },
    discountValue: {
      type:     Number,
      required: true,
      min:      [0.01, 'Discount must be positive'],
    },
    scope: {
      type:     String,
      required: true,
      enum:     ['global', 'course', 'publisher'],
      default:  'global',
    },
    // If scope === 'course': specific resourceIds this coupon applies to
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    // If scope === 'publisher': publisherId this coupon belongs to
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'AdminUser',
      default: null,
    },
    maxRedemptions: {
      type:    Number,
      default: null,
      min:     1,
    },
    redemptionCount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    oneTimePerUser: { type: Boolean, default: false },
    usedByUserIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt:      { type: Date, default: null },
    minimumCartAmount: { type: Number, default: 0, min: 0 },
    active:    { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ active: 1, expiresAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
