const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const QRToken = require('../models/QRToken');
const Employee = require('../models/Employee');
const TimeEntry = require('../models/TimeEntry');
const { checkAndCloseSession } = require('../utils/sessionWorker');

// @desc    Generate QR token for starting work session
// @route   POST /api/qr/generate-token
// @access  Private
const generateQRToken = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { validitySeconds = 120 } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Find employee linked to this user
  const employee = await Employee.findOne({ user: userId });

  if (!employee) {
    return res.status(404).json({ message: 'Nie znaleziono pracownika powiązanego z tym kontem' });
  }

  // Check if employee is active
  if (!employee.isActive) {
    return res.status(403).json({ message: 'Konto pracownika jest nieaktywne' });
  }

  // Generate token
  const { token, tokenHash, expiresAt } = QRToken.generateToken(
    userId, 
    employee._id, 
    Math.min(validitySeconds, 300) // Max 5 minutes
  );

  // Save token to database
  const qrToken = await QRToken.create({
    user: userId,
    employee: employee._id,
    tokenHash,
    expiresAt
  });

  return res.status(201).json({
    token,
    tokenId: qrToken._id,
    expiresAt,
    validitySeconds: Math.round((expiresAt - Date.now()) / 1000),
    qrUrl: `${process.env.FRONTEND_URL}/qr/start?token=${token}`
  });
});

// @desc    Start work session using QR token
// @route   POST /api/qr/start-by-token
// @access  Public (token-based auth)
const startByQRToken = asyncHandler(async (req, res) => {
  const { token, latitude, longitude, notes } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token jest wymagany' });
  }

  // Hash the token to find it in database
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find the token
  const qrToken = await QRToken.findOne({ tokenHash })
    .populate('user', 'name email')
    .populate('employee', 'firstName lastName position');

  if (!qrToken) {
    return res.status(404).json({ message: 'Nieprawidłowy token' });
  }

  // Verify token
  const verification = qrToken.verify();
  if (!verification.valid) {
    return res.status(400).json({ message: verification.reason });
  }

  // Check if employee is active
  if (!qrToken.employee.isActive) {
    return res.status(403).json({ message: 'Konto pracownika jest nieaktywne' });
  }

  // Check and auto-close any expired sessions
  await checkAndCloseSession(qrToken.employee._id);

  // Check if already clocked in
  const lastEntry = await TimeEntry.findOne({
    employee: qrToken.employee._id
  }).sort({ timestamp: -1 });

  if (lastEntry && (lastEntry.type === 'clock-in' || lastEntry.type === 'break-end')) {
    return res.status(400).json({
      message: 'Jesteś już zalogowany. Musisz się najpierw wylogować.'
    });
  }

  if (lastEntry && lastEntry.type === 'break-start') {
    return res.status(400).json({
      message: 'Jesteś na przerwie. Musisz najpierw zakończyć przerwę.'
    });
  }

  // Create clock-in entry
  const timeEntry = await TimeEntry.create({
    employee: qrToken.employee._id,
    user: qrToken.user._id,
    type: 'clock-in',
    timestamp: new Date(),
    location: latitude && longitude ? { latitude, longitude } : undefined,
    qrCode: `QR-TOKEN-${qrToken._id}`,
    notes: notes || 'Rozpoczęcie pracy przez QR kod',
    startedAt: new Date(),
    endedAt: null,
    endReason: 'manual'
  });

  // Mark token as used
  const ipAddress = req.ip || req.connection.remoteAddress;
  await qrToken.markAsUsed(ipAddress);

  // Populate employee and user data
  await timeEntry.populate('employee', 'firstName lastName position');
  await timeEntry.populate('user', 'name email');

  return res.status(201).json({
    message: 'Rozpoczęcie pracy zarejestrowane pomyślnie',
    timeEntry,
    employee: {
      id: qrToken.employee._id,
      firstName: qrToken.employee.firstName,
      lastName: qrToken.employee.lastName,
      position: qrToken.employee.position
    }
  });
});

// @desc    Verify QR token without using it
// @route   POST /api/qr/verify-token
// @access  Public
const verifyQRToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token jest wymagany' });
  }

  // Hash the token
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find the token
  const qrToken = await QRToken.findOne({ tokenHash })
    .populate('employee', 'firstName lastName position');

  if (!qrToken) {
    return res.status(404).json({ 
      valid: false, 
      message: 'Nieprawidłowy token' 
    });
  }

  // Verify token
  const verification = qrToken.verify();

  return res.status(200).json({
    valid: verification.valid,
    message: verification.valid ? 'Token jest prawidłowy' : verification.reason,
    expiresAt: qrToken.expiresAt,
    employee: verification.valid ? {
      firstName: qrToken.employee.firstName,
      lastName: qrToken.employee.lastName,
      position: qrToken.employee.position
    } : null
  });
});

// @desc    Cleanup expired tokens (admin only)
// @route   DELETE /api/qr/cleanup-expired
// @access  Private/Admin
const cleanupExpiredTokens = asyncHandler(async (req, res) => {
  const result = await QRToken.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  return res.status(200).json({
    message: `Usunięto ${result.deletedCount} wygasłych tokenów`,
    deletedCount: result.deletedCount
  });
});

module.exports = {
  generateQRToken,
  startByQRToken,
  verifyQRToken,
  cleanupExpiredTokens
};
