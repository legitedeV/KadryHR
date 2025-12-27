const mongoose = require('mongoose');

const trainingEnrollmentSchema = new mongoose.Schema(
  {
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'failed', 'expired'],
      default: 'not_started',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    expiresAt: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    quizAttempts: [
      {
        attemptedAt: { type: Date, default: Date.now },
        score: Number,
        answers: [
          {
            questionIndex: Number,
            selectedAnswer: Number,
            isCorrect: Boolean,
          },
        ],
        passed: Boolean,
      },
    ],
    bestScore: {
      type: Number,
      default: 0,
    },
    certificate: {
      issued: { type: Boolean, default: false },
      issuedAt: Date,
      certificateUrl: String,
    },
    notes: String,
  },
  { timestamps: true }
);

trainingEnrollmentSchema.index({ employee: 1, training: 1 });
trainingEnrollmentSchema.index({ status: 1 });
trainingEnrollmentSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);
