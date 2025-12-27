const mongoose = require('mongoose');

const benefitEnrollmentSchema = new mongoose.Schema(
  {
    benefit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Benefit',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'cancelled', 'expired'],
      default: 'pending',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    dependents: [
      {
        name: String,
        relationship: String,
        dateOfBirth: Date,
      },
    ],
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    notes: String,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

benefitEnrollmentSchema.index({ employee: 1, benefit: 1 });
benefitEnrollmentSchema.index({ status: 1 });
benefitEnrollmentSchema.index({ effectiveDate: 1 });

module.exports = mongoose.model('BenefitEnrollment', benefitEnrollmentSchema);
