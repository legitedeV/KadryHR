const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewPeriod: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    reviewType: {
      type: String,
      enum: ['quarterly', 'annual', 'probation', '360', 'self', 'project'],
      default: 'quarterly',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'completed', 'acknowledged'],
      default: 'draft',
    },
    ratings: [
      {
        category: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comments: String,
      },
    ],
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    strengths: [String],
    areasForImprovement: [String],
    goals: [
      {
        title: String,
        description: String,
        deadline: Date,
        status: {
          type: String,
          enum: ['not_started', 'in_progress', 'completed'],
          default: 'not_started',
        },
      },
    ],
    employeeComments: String,
    reviewerComments: String,
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    nextReviewDate: Date,
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

performanceReviewSchema.index({ employee: 1, createdAt: -1 });
performanceReviewSchema.index({ reviewer: 1 });
performanceReviewSchema.index({ status: 1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
