const mongoose = require('mongoose');

const shortAnswerCardSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID is required'],
    },
    question:    { type: String, required: [true, 'Question is required'], trim: true },
    answer:      { type: String, required: [true, 'Answer is required'], trim: true },
    explanation: { type: String, trim: true, default: '' },
    order:       { type: Number, default: 0 },
    phase:       { type: Number, enum: [1, 2], default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShortAnswerCard', shortAnswerCardSchema);
