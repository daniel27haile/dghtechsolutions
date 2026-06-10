const mongoose = require('mongoose');

/**
 * SiteContent model — stores all editable site content (hero, about, CTA, settings).
 * Uses a key-based approach so one document holds all site-wide settings.
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      comment: 'Unique key e.g. "hero", "about", "cta", "settings", "contact_info"',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      comment: 'Flexible JSON data for each section',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteContent', siteContentSchema);
