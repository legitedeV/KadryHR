const mongoose = require('mongoose');

const { Schema } = mongoose;

const shiftTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nazwa szablonu jest wymagana'],
      trim: true,
      maxlength: [100, 'Nazwa nie może przekraczać 100 znaków']
    },
    startTime: {
      type: String,
      required: [true, 'Godzina rozpoczęcia jest wymagana'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format godziny (HH:MM)']
    },
    endTime: {
      type: String,
      required: [true, 'Godzina zakończenia jest wymagana'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format godziny (HH:MM)']
    },
    color: {
      type: String,
      default: '#3b82f6',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Nieprawidłowy format koloru (hex)']
    },
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'custom'],
      default: 'custom'
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Opis nie może przekraczać 500 znaków']
    },
    // Break management
    breaks: [{
      startTime: {
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
      }
    }],
    // Work hours settings
    minDuration: {
      type: Number,
      min: [0.5, 'Minimalna długość zmiany to 0.5 godziny'],
      max: [24, 'Maksymalna długość zmiany to 24 godziny']
    },
    maxDuration: {
      type: Number,
      min: [0.5, 'Minimalna długość zmiany to 0.5 godziny'],
      max: [24, 'Maksymalna długość zmiany to 24 godziny']
    },
    allowFlexibleHours: {
      type: Boolean,
      default: false
    },
    // Staffing requirements
    minStaffing: {
      type: Number,
      min: [1, 'Minimalna obsada to 1 osoba'],
      default: 1
    },
    maxStaffing: {
      type: Number,
      min: [1, 'Maksymalna obsada to co najmniej 1 osoba']
    },
    // Skills and requirements
    requiredSkills: [{
      type: String,
      trim: true
    }],
    requiredCertifications: [{
      type: String,
      trim: true
    }],
    // Location and department
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location'
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department'
    },
    costCenter: {
      type: String,
      trim: true,
      maxlength: [50, 'Kod centrum kosztów nie może przekraczać 50 znaków']
    },
    // Tags for categorization
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag nie może przekraczać 30 znaków']
    }],
    // Overtime settings
    allowOvertime: {
      type: Boolean,
      default: true
    },
    overtimeThreshold: {
      type: Number,
      min: [0, 'Próg nadgodzin nie może być ujemny'],
      default: 8
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for querying by company
shiftTemplateSchema.index({ company: 1 });
shiftTemplateSchema.index({ company: 1, isDefault: 1 });

// Virtual for calculating duration in hours
shiftTemplateSchema.virtual('durationHours').get(function() {
  const [startHour, startMin] = this.startTime.split(':').map(Number);
  const [endHour, endMin] = this.endTime.split(':').map(Number);
  
  let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (duration < 0) {
    duration += 24 * 60; // Handle overnight shifts
  }
  
  return duration / 60;
});

// Virtual for calculating total break duration
shiftTemplateSchema.virtual('totalBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks.reduce((total, breakItem) => total + (breakItem.duration || 0), 0);
});

// Virtual for calculating paid break duration
shiftTemplateSchema.virtual('paidBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks
    .filter(breakItem => breakItem.isPaid)
    .reduce((total, breakItem) => total + (breakItem.duration || 0), 0);
});

// Virtual for calculating unpaid break duration
shiftTemplateSchema.virtual('unpaidBreakDuration').get(function() {
  if (!this.breaks || this.breaks.length === 0) return 0;
  return this.breaks
    .filter(breakItem => !breakItem.isPaid)
    .reduce((total, breakItem) => total + (breakItem.duration || 0), 0);
});

// Virtual for calculating net work hours (excluding unpaid breaks)
shiftTemplateSchema.virtual('netWorkHours').get(function() {
  const grossHours = this.durationHours;
  const unpaidBreakHours = this.unpaidBreakDuration / 60;
  return grossHours - unpaidBreakHours;
});

// Validation: minDuration should be less than maxDuration
shiftTemplateSchema.pre('save', function(next) {
  if (this.minDuration && this.maxDuration && this.minDuration > this.maxDuration) {
    next(new Error('Minimalna długość zmiany nie może być większa niż maksymalna'));
  }
  
  if (this.minStaffing && this.maxStaffing && this.minStaffing > this.maxStaffing) {
    next(new Error('Minimalna obsada nie może być większa niż maksymalna'));
  }
  
  next();
});

shiftTemplateSchema.set('toJSON', { virtuals: true });
shiftTemplateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShiftTemplate', shiftTemplateSchema);
