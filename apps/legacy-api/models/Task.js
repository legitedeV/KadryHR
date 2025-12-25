const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Tytuł zadania jest wymagany'],
      trim: true,
      maxlength: [200, 'Tytuł nie może przekraczać 200 znaków']
    },
    description: {
      type: String,
      required: [true, 'Opis zadania jest wymagany'],
      trim: true,
      maxlength: [2000, 'Opis nie może przekraczać 2000 znaków']
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pracownik jest wymagany']
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Firma jest wymagana']
    },
    dueDate: {
      type: Date,
      required: [true, 'Data wykonania jest wymagana']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Twórca zadania jest wymagany']
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'rejected', 'completed_late'],
      default: 'assigned'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    employeeComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Komentarz nie może przekraczać 1000 znaków']
    },
    attachmentUrl: {
      type: String,
      trim: true
    },
    completedAt: {
      type: Date
    },
    scheduledDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
taskSchema.index({ employee: 1, createdAt: -1 });
taskSchema.index({ company: 1, createdAt: -1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
