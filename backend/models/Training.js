const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['compliance', 'technical', 'soft_skills', 'leadership', 'safety', 'onboarding', 'product', 'other'],
      default: 'other',
    },
    type: {
      type: String,
      enum: ['online', 'in_person', 'hybrid', 'video', 'document', 'quiz'],
      default: 'online',
    },
    duration: {
      type: Number,
      required: true,
    },
    durationUnit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'hours',
    },
    content: {
      videoUrl: String,
      documentUrl: String,
      externalLink: String,
      materials: [
        {
          name: String,
          url: String,
          type: String,
        },
      ],
    },
    quiz: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
        points: { type: Number, default: 1 },
      },
    ],
    passingScore: {
      type: Number,
      default: 70,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    expiresAfter: {
      type: Number,
      default: null,
    },
    expiresUnit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months',
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [String],
  },
  { timestamps: true }
);

trainingSchema.index({ title: 'text', description: 'text' });
trainingSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Training', trainingSchema);
