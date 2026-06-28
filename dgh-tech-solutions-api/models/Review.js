const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 2000, trim: true, default: '' },
  },
  { timestamps: true }
);

// One review per user per resource
reviewSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
