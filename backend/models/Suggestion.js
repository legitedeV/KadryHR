const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['pomysl', 'problem', 'proces', 'inne'],
      default: 'pomysl',
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'closed'],
      default: 'open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedNote: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Suggestion', suggestionSchema);
