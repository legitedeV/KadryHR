const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  position: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  monthlySalary: { type: Number, default: 0 },
  hoursPerMonth: { type: Number, default: 160 },
  isActive: { type: Boolean, default: true },
  
  // Rozszerzone pola dla zaawansowanego planowania
  skills: {
    type: [String],
    default: [],
  },
  // Maksymalne godziny pracy
  maxHoursPerDay: {
    type: Number,
    default: 8,
    min: 1,
    max: 12,
  },
  maxHoursPerWeek: {
    type: Number,
    default: 40,
    min: 1,
    max: 60,
  },
  // Preferencje zmian
  preferredShifts: {
    type: [String],
    enum: ['morning', 'afternoon', 'night', 'full-day'],
    default: [],
  },
  // Czy pracownik może pracować w nocy
  canWorkNights: {
    type: Boolean,
    default: true,
  },
  // Czy pracownik może pracować w weekendy
  canWorkWeekends: {
    type: Boolean,
    default: true,
  },
  // Priorytet przy przydzielaniu zmian (1-10, wyższy = wyższy priorytet)
  schedulingPriority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10,
  },
  // Powiązanie z kontem użytkownika (dla aplikacji mobilnej)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Indexes for performance
employeeSchema.index({ companyId: 1, isActive: 1 });
employeeSchema.index({ companyId: 1, firstName: 1, lastName: 1 });
employeeSchema.index({ user: 1 });
employeeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
