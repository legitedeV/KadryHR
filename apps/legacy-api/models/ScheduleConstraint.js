const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Ograniczenia i reguły dla generowania grafików
 * Zgodność z Kodeksem Pracy i zasadami firmowymi
 */
const scheduleConstraintSchema = new Schema(
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
    // Typ ograniczenia
    type: {
      type: String,
      enum: [
        'labor_law',      // Kodeks Pracy
        'company_policy', // Zasady firmowe
        'budget',         // Ograniczenia budżetowe
        'staffing',       // Wymagania kadrowe
        'custom',         // Niestandardowe
      ],
      required: true,
    },
    // Kategoria
    category: {
      type: String,
      enum: [
        'rest_period',        // Okresy odpoczynku
        'max_hours',          // Maksymalne godziny
        'overtime',           // Nadgodziny
        'night_shift',        // Praca nocna
        'weekend_work',       // Praca w weekendy
        'consecutive_days',   // Kolejne dni pracy
        'min_staff',          // Minimalna obsada
        'max_staff',          // Maksymalna obsada
        'cost_limit',         // Limit kosztów
        'other',
      ],
      required: true,
    },
    // Reguła w formacie JSON
    rule: {
      type: Schema.Types.Mixed,
      required: true,
      /*
      Przykłady:
      {
        "minRestHours": 11,
        "description": "Minimalny odpoczynek dobowy"
      }
      {
        "maxHoursPerDay": 8,
        "maxHoursPerWeek": 40,
        "maxOvertimePerMonth": 48
      }
      {
        "nightShiftStart": "22:00",
        "nightShiftEnd": "06:00",
        "maxConsecutiveNights": 5
      }
      */
    },
    // Poziom ważności
    severity: {
      type: String,
      enum: ['error', 'warning', 'info'],
      default: 'warning',
    },
    // Czy reguła jest aktywna
    isActive: {
      type: Boolean,
      default: true,
    },
    // Czy można nadpisać (override)
    canOverride: {
      type: Boolean,
      default: false,
    },
    // Priorytet (wyższy = ważniejszy)
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy
scheduleConstraintSchema.index({ companyId: 1, isActive: 1 });
scheduleConstraintSchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('ScheduleConstraint', scheduleConstraintSchema);
