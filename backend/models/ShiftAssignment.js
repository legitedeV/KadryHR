const mongoose = require('mongoose');

const { Schema } = mongoose;

const shiftAssignmentSchema = new Schema(
  {
    schedule: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['shift', 'leave', 'off', 'sick', 'holiday'],
      default: 'shift'
    },
    startTime: {
      type: String, // format "HH:MM"
      required: function() {
        return this.type === 'shift';
      }
    },
    endTime: {
      type: String, // format "HH:MM"
      required: function() {
        return this.type === 'shift';
      }
    },
    shiftTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftTemplate'
    },
    notes: {
      type: String,
      trim: true
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 720
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
shiftAssignmentSchema.index({ schedule: 1, employee: 1, date: 1 });
shiftAssignmentSchema.index({ employee: 1, date: 1 });
shiftAssignmentSchema.index({ date: 1 });

// Virtual for duration in hours
shiftAssignmentSchema.virtual('durationHours').get(function() {
  if (this.type !== 'shift' || !this.startTime || !this.endTime) {
    return 0;
  }
  
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  return (endMinutes - startMinutes) / 60;
});

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema);
