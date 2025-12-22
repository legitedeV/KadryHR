const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Szablon zmiany - wielokrotnego użytku wzorce zmian
 * Ułatwia tworzenie grafików dla pracy zmianowej
 */
const shiftTemplateSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Typ zmiany
    shiftType: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'full-day', 'custom'],
      default: 'custom',
    },
    startTime: {
      type: String, // format "HH:MM"
      required: true,
    },
    endTime: {
      type: String, // format "HH:MM"
      required: true,
    },
    // Przerwy w trakcie zmiany
    breaks: [
      {
        startTime: String, // format "HH:MM"
        endTime: String,   // format "HH:MM"
        type: {
          type: String,
          enum: ['meal', 'rest', 'other'],
          default: 'rest',
        },
      },
    ],
    // Wymagana liczba pracowników na tej zmianie
    requiredStaff: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Wymagane umiejętności/stanowiska
    requiredSkills: {
      type: [String],
      default: [],
    },
    // Kolor dla wizualizacji w grafiku
    color: {
      type: String,
      default: '#3b82f6',
    },
    // Czy zmiana jest aktywna
    isActive: {
      type: Boolean,
      default: true,
    },
    // Dodatkowe koszty (np. dodatek nocny)
    additionalCostMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy
shiftTemplateSchema.index({ companyId: 1, isActive: 1 });
shiftTemplateSchema.index({ shiftType: 1 });

module.exports = mongoose.model('ShiftTemplate', shiftTemplateSchema);
