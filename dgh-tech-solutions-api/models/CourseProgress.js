const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    resourceId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Resource',
      required: true,
      index:    true,
    },
    // IDs (string) of completed lessons / questions / cards
    completedItemIds:   [{ type: String }],
    // Last position the user was at
    currentItemId:      { type: String, default: null },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type:    String,
      enum:    ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
      index:   true,
    },
    startedAt:      { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null },
    completedAt:    { type: Date, default: null },
  },
  { timestamps: true }
);

// Unique progress record per user per resource
courseProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
