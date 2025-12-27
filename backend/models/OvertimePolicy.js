const mongoose = require('mongoose');

const { Schema } = mongoose;

const overtimePolicySchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Nazwa polityki nadgodzin jest wymagana'],
      trim: true,
      maxlength: [100, 'Nazwa nie może przekraczać 100 znaków']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Opis nie może przekraczać 500 znaków']
    },
    // Daily overtime settings
    dailyOvertimeThreshold: {
      type: Number,
      required: [true, 'Dzienny próg nadgodzin jest wymagany'],
      min: [1, 'Próg musi być co najmniej 1 godzina'],
      max: [24, 'Próg nie może przekraczać 24 godzin'],
      default: 8
    },
    dailyOvertimeLimit: {
      type: Number,
      min: [0, 'Limit nie może być ujemny'],
      max: [24, 'Limit nie może przekraczać 24 godzin']
    },
    // Weekly overtime settings
    weeklyOvertimeThreshold: {
      type: Number,
      required: [true, 'Tygodniowy próg nadgodzin jest wymagany'],
      min: [1, 'Próg musi być co najmniej 1 godzina'],
      max: [168, 'Próg nie może przekraczać 168 godzin'],
      default: 40
    },
    weeklyOvertimeLimit: {
      type: Number,
      min: [0, 'Limit nie może być ujemny'],
      max: [168, 'Limit nie może przekraczać 168 godzin'],
      default: 48
    },
    // Monthly overtime settings
    monthlyOvertimeLimit: {
      type: Number,
      min: [0, 'Limit nie może być ujemny'],
      max: [744, 'Limit nie może przekraczać 744 godzin']
    },
    // Overtime rates
    overtimeRate: {
      type: Number,
      required: [true, 'Stawka nadgodzin jest wymagana'],
      min: [1, 'Stawka musi być co najmniej 1.0x'],
      max: [5, 'Stawka nie może przekraczać 5.0x'],
      default: 1.5
    },
    weekendOvertimeRate: {
      type: Number,
      min: [1, 'Stawka musi być co najmniej 1.0x'],
      max: [5, 'Stawka nie może przekraczać 5.0x'],
      default: 2.0
    },
    holidayOvertimeRate: {
      type: Number,
      min: [1, 'Stawka musi być co najmniej 1.0x'],
      max: [5, 'Stawka nie może przekraczać 5.0x'],
      default: 2.5
    },
    nightShiftOvertimeRate: {
      type: Number,
      min: [1, 'Stawka musi być co najmniej 1.0x'],
      max: [5, 'Stawka nie może przekraczać 5.0x'],
      default: 1.75
    },
    // Approval settings
    requiresApproval: {
      type: Boolean,
      default: true
    },
    autoApproveUnder: {
      type: Number,
      min: [0, 'Wartość nie może być ujemna'],
      max: [24, 'Wartość nie może przekraczać 24 godzin'],
      default: 2
    },
    approvalRequired: [{
      type: String,
      enum: ['manager', 'hr', 'admin', 'director'],
      default: 'manager'
    }],
    // Notification settings
    notifyManagerAt: {
      type: Number,
      min: [0, 'Wartość nie może być ujemna'],
      max: [24, 'Wartość nie może przekraczać 24 godzin'],
      default: 4
    },
    notifyHRAt: {
      type: Number,
      min: [0, 'Wartość nie może być ujemna'],
      max: [24, 'Wartość nie może przekraczać 24 godzin'],
      default: 8
    },
    sendWeeklyReport: {
      type: Boolean,
      default: true
    },
    sendMonthlyReport: {
      type: Boolean,
      default: true
    },
    // Budget settings
    monthlyOvertimeBudget: {
      type: Number,
      min: [0, 'Budżet nie może być ujemny']
    },
    alertAtBudgetPercentage: {
      type: Number,
      min: [0, 'Procent nie może być ujemny'],
      max: [100, 'Procent nie może przekraczać 100'],
      default: 80
    },
    // Restrictions
    allowConsecutiveOvertimeDays: {
      type: Boolean,
      default: true
    },
    maxConsecutiveOvertimeDays: {
      type: Number,
      min: [1, 'Minimum 1 dzień'],
      max: [7, 'Maksimum 7 dni'],
      default: 5
    },
    restrictOvertimeForPartTime: {
      type: Boolean,
      default: true
    },
    // Applicable to
    applicableTo: {
      departments: [{
        type: Schema.Types.ObjectId,
        ref: 'Department'
      }],
      positions: [{
        type: String,
        trim: true
      }],
      employees: [{
        type: Schema.Types.ObjectId,
        ref: 'Employee'
      }]
    },
    // Exclusions
    excludedEmployees: [{
      type: Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    // Status
    isActive: {
      type: Boolean,
      default: true
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    effectiveTo: {
      type: Date
    },
    // Compliance
    complianceNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notatki nie mogą przekraczać 1000 znaków']
    },
    legalReference: {
      type: String,
      trim: true,
      maxlength: [500, 'Odniesienie prawne nie może przekraczać 500 znaków']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
overtimePolicySchema.index({ company: 1, isActive: 1 });
overtimePolicySchema.index({ company: 1, effectiveFrom: 1, effectiveTo: 1 });

// Validation: effectiveTo must be after effectiveFrom
overtimePolicySchema.pre('save', function(next) {
  if (this.effectiveTo && this.effectiveFrom && this.effectiveTo <= this.effectiveFrom) {
    next(new Error('Data zakończenia musi być późniejsza niż data rozpoczęcia'));
  }
  
  if (this.dailyOvertimeLimit && this.dailyOvertimeThreshold && 
      this.dailyOvertimeLimit < this.dailyOvertimeThreshold) {
    next(new Error('Dzienny limit nadgodzin nie może być mniejszy niż próg'));
  }
  
  if (this.weeklyOvertimeLimit && this.weeklyOvertimeThreshold && 
      this.weeklyOvertimeLimit < this.weeklyOvertimeThreshold) {
    next(new Error('Tygodniowy limit nadgodzin nie może być mniejszy niż próg'));
  }
  
  next();
});

// Method to check if policy is currently effective
overtimePolicySchema.methods.isEffective = function(date = new Date()) {
  if (!this.isActive) return false;
  if (this.effectiveFrom && date < this.effectiveFrom) return false;
  if (this.effectiveTo && date > this.effectiveTo) return false;
  return true;
};

// Method to check if overtime requires approval
overtimePolicySchema.methods.requiresApprovalForHours = function(hours) {
  if (!this.requiresApproval) return false;
  if (this.autoApproveUnder && hours <= this.autoApproveUnder) return false;
  return true;
};

// Method to calculate overtime rate for specific conditions
overtimePolicySchema.methods.getOvertimeRate = function(isWeekend, isHoliday, isNightShift) {
  if (isHoliday && this.holidayOvertimeRate) return this.holidayOvertimeRate;
  if (isWeekend && this.weekendOvertimeRate) return this.weekendOvertimeRate;
  if (isNightShift && this.nightShiftOvertimeRate) return this.nightShiftOvertimeRate;
  return this.overtimeRate;
};

overtimePolicySchema.set('toJSON', { virtuals: true });
overtimePolicySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('OvertimePolicy', overtimePolicySchema);
