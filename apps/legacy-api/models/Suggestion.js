const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['availability', 'other'],
      default: 'other'
    },
    category: {
      type: String,
      enum: ['pomysl', 'problem', 'proces', 'inne'],
      default: 'pomysl',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'open', 'in_review', 'closed'],
      default: 'pending',
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedNote: { type: String, trim: true },
    adminResponse: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Suggestion', suggestionSchema);
