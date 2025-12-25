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

shiftTemplateSchema.set('toJSON', { virtuals: true });
shiftTemplateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShiftTemplate', shiftTemplateSchema);
