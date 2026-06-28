const mongoose = require('mongoose');

const purchaseAccessSchema = new mongoose.Schema(
  {
    userId:                { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    userEmail:             { type: String },
    resourceId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    // The resource/bundle the user actually purchased (may differ from resourceId for bundle items)
    sourceResourceId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    sourcePurchaseType:    { type: String, enum: ['SINGLE_RESOURCE', 'BUNDLE'], default: 'SINGLE_RESOURCE' },
    status:                { type: String, enum: ['PAID', 'FAILED', 'REFUNDED'], default: 'PAID' },
    accessType:            { type: String, enum: ['LIFETIME', 'SAVED_FREE'], default: 'LIFETIME' },
    paymentProvider:       { type: String, default: 'STRIPE' },
    stripeSessionId:       { type: String },
    stripePaymentIntentId: { type: String },
    amountPaid:            { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent duplicate purchase records — one entry per user per resource
purchaseAccessSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseAccess', purchaseAccessSchema);
