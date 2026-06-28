const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Interview Questions',
        'Certification Questions',
        'Useful Resources',
        'Multiple Choice Practice',
        'Short Answer / Flashcards',
      ],
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['PDF', 'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'BUNDLE'],
    },
    // BUNDLE only — list of resource IDs included in this bundle
    includedResourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    thumbnailUrl:     { type: String, trim: true, default: '' },
    pdfUrl:           { type: String, trim: true, default: '' },
    previewPageLimit: { type: Number, default: 2, min: 0 },
    isPaid:           { type: Boolean, default: false },
    price:            { type: Number, default: 0, min: 0 },
    // ─── Structured pricing ────────────────────────────────────────────────────
    pricing: {
      isFree:                { type: Boolean, default: false },
      oldPrice:              { type: Number, default: 0, min: 0 },
      salePrice:             { type: Number, default: 0, min: 0 },
      discountPercent:       { type: Number, default: 0, min: 0, max: 100 },
      autoCalculateDiscount: { type: Boolean, default: true },
      currency:              { type: String, default: 'USD', trim: true },
    },
    // ─── Marketing labels ─────────────────────────────────────────────────────
    labels: {
      bestSeller:  { type: Boolean, default: false },
      hotSelling:  { type: Boolean, default: false },
      isNew:       { type: Boolean, default: false },
      recommended: { type: Boolean, default: false },
    },
    isPublished:      { type: Boolean, default: false },
    isFeatured:       { type: Boolean, default: false },
    tags:             [{ type: String, trim: true }],
    displayOrder:     { type: Number, default: 0 },
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:      { type: Number, default: 0, min: 0 },
    // ─── Extended detail fields ────────────────────────────────────────────────
    fullDescription:  { type: String, maxlength: 5000, trim: true, default: '' },
    level:            { type: String, enum: ['Beginner → Intermediate', 'Intermediate → Advanced', 'All Levels'], default: 'All Levels' },
    duration:         { type: String, trim: true, default: '' },
    lessonCount:      { type: Number, default: 0, min: 0 },
    whatYouWillLearn: [{ type: String, trim: true }],
    curriculum: [{
      sectionTitle: { type: String, trim: true },
      lessons:      [{ type: String, trim: true }],
    }],
    requirements:   [{ type: String, trim: true }],
    targetAudience: [{ type: String, trim: true }],
    // Publisher / owner — null means platform-owned content
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null, index: true },
  },
  { timestamps: true }
);

// Auto-generate slug from title if not provided
resourceSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
