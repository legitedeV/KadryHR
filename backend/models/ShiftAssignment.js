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
    color: {
      type: String,
      default: '#3b82f6'
    },
    // Break management for individual assignments
    breaks: [{
      startTime: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format godziny (HH:MM)']
      },
      endTime: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format godziny (HH:MM)']
      },
      duration: {
        type: Number,
        min: [5, 'Przerwa musi trwać co najmniej 5 minut'],
        max: [120, 'Przerwa nie może trwać dłużej niż 120 minut']
      },
      isPaid: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['meal', 'rest', 'other'],
        default: 'rest'
      },
      description: {
        type: String,
        trim: true,
        maxlength: [200, 'Opis przerwy nie może przekraczać 200 znaków']
      },
      taken: {
        type: Boolean,
        default: false
      },
      takenAt: {
        type: Date
      }
    }],
    // Reminder settings
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: {
      type: Date
    },
    breakReminderEnabled: {
      type: Boolean,
      default: true
    },
    // Overtime tracking
    isOvertime: {
      type: Boolean,
      default: false
    },
    overtimeApproved: {
      type: Boolean,
      default: false
    },
    overtimeApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    overtimeApprovedAt: {
      type: Date
    },
    // Status tracking
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    confirmedAt: {
      type: Date
    },
    completedAt: {
      type: Date
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

// Virtual for total break duration
shiftAssignmentSchema.virtual('totalBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks.reduce((total, breakItem) => {
    if (breakItem.duration) return total + breakItem.duration;
    if (breakItem.startTime && breakItem.endTime) {
      const [startHour, startMin] = breakItem.startTime.split(':').map(Number);
      const [endHour, endMin] = breakItem.endTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return total + (duration > 0 ? duration : 0);
    }
    return total;
  }, 0);
});

// Virtual for paid break duration
shiftAssignmentSchema.virtual('paidBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks
    .filter(breakItem => breakItem.isPaid)
    .reduce((total, breakItem) => {
      if (breakItem.duration) return total + breakItem.duration;
      if (breakItem.startTime && breakItem.endTime) {
        const [startHour, startMin] = breakItem.startTime.split(':').map(Number);
        const [endHour, endMin] = breakItem.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        return total + (duration > 0 ? duration : 0);
      }
      return total;
    }, 0);
});

// Virtual for unpaid break duration
shiftAssignmentSchema.virtual('unpaidBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks
    .filter(breakItem => !breakItem.isPaid)
    .reduce((total, breakItem) => {
      if (breakItem.duration) return total + breakItem.duration;
      if (breakItem.startTime && breakItem.endTime) {
        const [startHour, startMin] = breakItem.startTime.split(':').map(Number);
        const [endHour, endMin] = breakItem.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        return total + (duration > 0 ? duration : 0);
      }
      return total;
    }, 0);
});

// Virtual for net work hours (excluding unpaid breaks)
shiftAssignmentSchema.virtual('netWorkHours').get(function() {
  const grossHours = this.durationHours;
  const unpaidBreakHours = this.unpaidBreakDuration / 60;
  return grossHours - unpaidBreakHours;
});

// Pre-save hook to copy breaks from template if not set
shiftAssignmentSchema.pre('save', async function(next) {
  if (this.isNew && this.shiftTemplate && (!this.breaks || this.breaks.length === 0)) {
    try {
      const ShiftTemplate = mongoose.model('ShiftTemplate');
      const template = await ShiftTemplate.findById(this.shiftTemplate);
      if (template && template.breaks && template.breaks.length > 0) {
        this.breaks = template.breaks.map(b => ({
          startTime: b.startTime,
          duration: b.duration,
          isPaid: b.isPaid,
          type: b.type,
          description: b.description,
          taken: false
        }));
      }
    } catch (_err) {
      // Continue without breaks if template fetch fails
    }
  }
  next();
});

shiftAssignmentSchema.set('toJSON', { virtuals: true });
shiftAssignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShiftAssignment', shiftAssignmentSchema);
