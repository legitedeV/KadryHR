const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['clock-in', 'clock-out', 'break-start', 'break-end'], 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  qrCode: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  // Calculated fields for completed work sessions
  duration: {
    type: Number, // in minutes
    default: 0
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry'
  }
}, { timestamps: true });

// Index for faster queries
timeEntrySchema.index({ employee: 1, timestamp: -1 });
timeEntrySchema.index({ user: 1, timestamp: -1 });
timeEntrySchema.index({ qrCode: 1 });

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
