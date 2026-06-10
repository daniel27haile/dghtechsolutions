const mongoose = require('mongoose');

/**
 * PageVisit model — stores analytics data for website visits.
 * Raw IP is never stored. We store a hashed visitor identifier only.
 */
const pageVisitSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      trim: true,
      comment: 'URL path visited e.g. "/", "/services", "/contact"',
    },
    referrer: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: '',
    },
    visitorHash: {
      type: String,
      default: '',
      comment: 'SHA-256 hash of IP+UA — no raw IP stored',
    },
    sessionId: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Index for efficient analytics queries
pageVisitSchema.index({ timestamp: -1 });
pageVisitSchema.index({ path: 1, timestamp: -1 });

module.exports = mongoose.model('PageVisit', pageVisitSchema);
