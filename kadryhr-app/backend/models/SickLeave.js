const mongoose = require('mongoose');

const { Schema } = mongoose;

const sickLeaveSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    certificateNumber: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

sickLeaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('SickLeave', sickLeaveSchema);
