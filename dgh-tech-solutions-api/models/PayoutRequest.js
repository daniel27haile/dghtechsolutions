const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema(
  {
    publisherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'AdminUser',
      required: true,
      index:    true,
    },
    grossAmount:       { type: Number, required: true, min: 0 },
    platformFeeAmount: { type: Number, default: 0, min: 0 },
    netAmount:         { type: Number, required: true, min: 0 },
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
      index:   true,
    },
    requestedAt: { type: Date, default: () => new Date() },
    approvedAt:  { type: Date, default: null },
    paidAt:      { type: Date, default: null },
    rejectedAt:  { type: Date, default: null },
    rejectedReason: { type: String, default: '' },
    // Snapshot of orders included in this payout
    orderIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    notes:       { type: String, default: '' },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ publisherId: 1, status: 1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
