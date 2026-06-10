const mongoose = require('mongoose');

/**
 * Service model — stores services offered by DGH Tech Solutions.
 */
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    fullDescription: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from title
serviceSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
