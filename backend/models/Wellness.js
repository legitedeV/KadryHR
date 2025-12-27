const mongoose = require('mongoose');

const wellnessSchema = new mongoose.Schema(
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
      enum: ['physical', 'mental', 'nutrition', 'financial', 'social', 'challenge', 'event', 'resource'],
      default: 'physical',
    },
    type: {
      type: String,
      enum: ['challenge', 'workshop', 'webinar', 'resource', 'benefit', 'event'],
      default: 'challenge',
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    participants: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        joinedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        completedAt: Date,
        points: { type: Number, default: 0 },
      },
    ],
    goals: [
      {
        title: String,
        target: Number,
        unit: String,
      },
    ],
    rewards: [
      {
        title: String,
        description: String,
        pointsRequired: Number,
      },
    ],
    resources: [
      {
        title: String,
        description: String,
        url: String,
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

wellnessSchema.index({ category: 1, isActive: 1 });
wellnessSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Wellness', wellnessSchema);
