const mongoose = require('mongoose');

const { Schema } = mongoose;

const scheduleTemplateAssignmentSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['shift', 'leave', 'off', 'sick', 'holiday'],
      default: 'shift'
    },
    startTime: String,
    endTime: String,
    shiftTemplate: {
      type: Schema.Types.ObjectId,
      ref: 'ShiftTemplate'
    },
    notes: String,
    color: String
  },
  { _id: false }
);

const scheduleTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String // YYYY-MM snapshot for reference
    },
    year: Number,
    assignments: [scheduleTemplateAssignmentSchema]
  },
  { timestamps: true }
);

scheduleTemplateSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('ScheduleTemplate', scheduleTemplateSchema);
