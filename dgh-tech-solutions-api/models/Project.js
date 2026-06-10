const mongoose = require('mongoose');

/**
 * Project model — stores portfolio/showcase projects.
 */
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
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
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile App',
        'UI/UX Design',
        'E-Commerce',
        'SaaS',
        'API Integration',
        'Cloud Solutions',
        'Other',
      ],
    },
    techStack: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    liveUrl: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    problemSolved: {
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
    client: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from title
projectSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
