const mongoose = require('mongoose');

const { Schema } = mongoose;

const scheduleSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    month: {
      type: String, // format "YYYY-MM"
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    publishedAt: {
      type: Date
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for querying by month and team
scheduleSchema.index({ month: 1, teamId: 1 });
scheduleSchema.index({ year: 1, month: 1 });
scheduleSchema.index({ company: 1, month: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
