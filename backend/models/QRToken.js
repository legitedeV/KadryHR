const mongoose = require('mongoose');
const crypto = require('crypto');

const qrTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

// Index for cleanup of expired tokens
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate token
qrTokenSchema.statics.generateToken = function(userId, employeeId, validitySeconds = 120) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + validitySeconds * 1000);
  
  return { token, tokenHash, expiresAt };
};

// Method to verify token
qrTokenSchema.methods.verify = function() {
  if (this.isUsed) {
    return { valid: false, reason: 'Token już został użyty' };
  }
  
  if (new Date() > this.expiresAt) {
    return { valid: false, reason: 'Token wygasł' };
  }
  
  return { valid: true };
};

// Method to mark as used
qrTokenSchema.methods.markAsUsed = async function(ipAddress) {
  this.isUsed = true;
  this.usedAt = new Date();
  if (ipAddress) {
    this.ipAddress = ipAddress;
  }
  await this.save();
};

module.exports = mongoose.model('QRToken', qrTokenSchema);
