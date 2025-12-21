const mongoose = require('mongoose');

const { Schema } = mongoose;

const scheduleEntrySchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // format "HH:MM"
      required: true,
    },
    endTime: {
      type: String, // format "HH:MM"
      required: true,
    },
    type: {
      type: String,
      enum: ['regular', 'overtime', 'duty', 'off'],
      default: 'regular',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// indeks przydatny do zapytań po pracowniku i zakresie dat
scheduleEntrySchema.index({ employee: 1, date: 1 });

module.exports = mongoose.model('ScheduleEntry', scheduleEntrySchema);
