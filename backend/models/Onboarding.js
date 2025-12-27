const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'delayed'],
      default: 'not_started',
    },
    buddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checklist: [
      {
        title: { type: String, required: true },
        description: String,
        category: {
          type: String,
          enum: ['hr', 'it', 'training', 'team', 'admin', 'other'],
          default: 'other',
        },
        dueDate: Date,
        completed: { type: Boolean, default: false },
        completedAt: Date,
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        order: { type: Number, default: 0 },
        isRequired: { type: Boolean, default: true },
        notes: String,
      },
    ],
    documents: [
      {
        name: String,
        description: String,
        url: String,
        signed: { type: Boolean, default: false },
        signedAt: Date,
        required: { type: Boolean, default: false },
      },
    ],
    trainings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Training',
      },
    ],
    meetings: [
      {
        title: String,
        description: String,
        scheduledFor: Date,
        attendees: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
        completed: { type: Boolean, default: false },
        notes: String,
      },
    ],
    feedback: [
      {
        date: { type: Date, default: Date.now },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        content: String,
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

onboardingSchema.index({ employee: 1 });
onboardingSchema.index({ status: 1 });
onboardingSchema.index({ startDate: 1 });

onboardingSchema.methods.calculateCompletion = function () {
  const requiredItems = this.checklist.filter((item) => item.isRequired);
  const completedItems = requiredItems.filter((item) => item.completed);
  this.completionPercentage = requiredItems.length > 0 ? Math.round((completedItems.length / requiredItems.length) * 100) : 0;
  if (this.completionPercentage === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  }
  return this.completionPercentage;
};

module.exports = mongoose.model('Onboarding', onboardingSchema);
