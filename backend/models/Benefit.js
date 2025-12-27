const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema(
  {
    name: {
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
      enum: ['health', 'insurance', 'retirement', 'wellness', 'education', 'transportation', 'food', 'equipment', 'other'],
      default: 'other',
    },
    type: {
      type: String,
      enum: ['mandatory', 'optional', 'company_paid', 'employee_paid', 'shared'],
      default: 'optional',
    },
    provider: {
      name: String,
      contact: String,
      website: String,
    },
    cost: {
      employeeMonthly: { type: Number, default: 0 },
      companyMonthly: { type: Number, default: 0 },
      currency: { type: String, default: 'PLN' },
    },
    eligibility: {
      minTenure: { type: Number, default: 0 },
      minTenureUnit: {
        type: String,
        enum: ['days', 'months', 'years'],
        default: 'months',
      },
      employmentTypes: [String],
      positions: [String],
    },
    enrollmentPeriod: {
      startDate: Date,
      endDate: Date,
      isOpen: { type: Boolean, default: true },
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

benefitSchema.index({ category: 1, isActive: 1 });
benefitSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Benefit', benefitSchema);
