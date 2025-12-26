const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nazwa organizacji jest wymagana'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['starter', 'pro', 'enterprise'],
        default: 'starter',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'canceled'],
        default: 'trial',
      },
      trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      renewedAt: {
        type: Date,
        default: null,
      },
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    settings: {
      locale: { type: String, default: 'pl-PL' },
      timezone: { type: String, default: 'Europe/Warsaw' },
      currency: { type: String, default: 'PLN' },
    },
    metadata: {
      employeesCount: { type: Number, default: 0 },
      seatsLimit: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

organizationSchema.index({ owner: 1 });
organizationSchema.index({ slug: 1 });
organizationSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('Organization', organizationSchema);
