const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Model dostępności pracownika - pozwala pracownikom zgłaszać swoją dyspozycyjność
 * Integracja z aplikacją mobilną Kadromierz Pracownik
 */
const employeeAvailabilitySchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    // Zakres dat dostępności
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Dni tygodnia (0 = niedziela, 6 = sobota)
    daysOfWeek: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // domyślnie pon-pt
      validate: {
        validator: function(arr) {
          return arr.every(day => day >= 0 && day <= 6);
        },
        message: 'Dni tygodnia muszą być w zakresie 0-6',
      },
    },
    // Preferowane godziny pracy
    preferredStartTime: {
      type: String, // format "HH:MM"
      default: '08:00',
    },
    preferredEndTime: {
      type: String, // format "HH:MM"
      default: '16:00',
    },
    // Maksymalna liczba godzin dziennie
    maxHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 12,
    },
    // Maksymalna liczba godzin tygodniowo
    maxHoursPerWeek: {
      type: Number,
      default: 40,
      min: 1,
      max: 60,
    },
    // Typ dostępności
    type: {
      type: String,
      enum: ['available', 'preferred', 'unavailable', 'limited'],
      default: 'available',
    },
    // Notatki od pracownika
    notes: {
      type: String,
      trim: true,
    },
    // Status zatwierdzenia przez managera
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy dla wydajności
employeeAvailabilitySchema.index({ employee: 1, startDate: 1, endDate: 1 });
employeeAvailabilitySchema.index({ status: 1 });

module.exports = mongoose.model('EmployeeAvailability', employeeAvailabilitySchema);
