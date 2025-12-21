const mongoose = require('mongoose');

const worktimeSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
  overtimeHours: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('WorktimeEntry', worktimeSchema);
