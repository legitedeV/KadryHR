const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    requesterEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    swapWithEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminNote: { type: String, trim: true },
  },
  { timestamps: true }
);

swapRequestSchema.index({ date: 1, requesterEmployee: 1 });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
