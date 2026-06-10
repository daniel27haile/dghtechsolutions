const mongoose = require('mongoose');

/**
 * ContactMessage model — stores messages submitted via the contact form.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    serviceInterest: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    ipHash: {
      type: String,
      default: '',
      comment: 'Hashed IP for spam detection — raw IP is never stored',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
