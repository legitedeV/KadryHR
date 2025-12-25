const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  eventTypes: [{
    type: String,
    enum: [
      'employee.created',
      'employee.updated',
      'employee.deactivated',
      'leave.created',
      'leave.statusChanged',
      'schedule.updated',
      'task.assigned',
      'task.completed',
    ],
    required: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  secret: {
    type: String,
    trim: true,
  },
  lastTriggeredAt: {
    type: Date,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Indexes
webhookSchema.index({ companyId: 1, isActive: 1 });
webhookSchema.index({ eventTypes: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
