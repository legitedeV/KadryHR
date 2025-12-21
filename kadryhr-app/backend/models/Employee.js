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
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
