const mongoose = require('mongoose');

const mcqQuestionSchema = new mongoose.Schema(
  {
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource ID is required'],
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    choices: {
      A: { type: String, required: [true, 'Choice A is required'], trim: true },
      B: { type: String, required: [true, 'Choice B is required'], trim: true },
      C: { type: String, required: [true, 'Choice C is required'], trim: true },
      D: { type: String, required: [true, 'Choice D is required'], trim: true },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
      enum: ['A', 'B', 'C', 'D'],
    },
    explanation: { type: String, trim: true, default: '' },
    order:       { type: Number, default: 0 },
    phase:       { type: Number, enum: [1, 2], default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('McqQuestion', mcqQuestionSchema);
