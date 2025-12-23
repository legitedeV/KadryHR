const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const TimeEntry = require('../models/TimeEntry');
const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Clock in/out with QR code
// @route   POST /api/time-tracking/scan
// @access  Private
const scanQRCode = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { qrCode, type, latitude, longitude, notes } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  if (!qrCode || !type) {
    return res.status(400).json({ message: 'Kod QR i typ akcji są wymagane' });
  }

  if (!['clock-in', 'clock-out', 'break-start', 'break-end'].includes(type)) {
    return res.status(400).json({ message: 'Nieprawidłowy typ akcji' });
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

  // Get the last entry for this employee
  const lastEntry = await TimeEntry.findOne({ 
    employee: employee._id 
  }).sort({ timestamp: -1 });

  // Validation logic
  if (type === 'clock-in') {
    if (lastEntry && lastEntry.type === 'clock-in') {
      return res.status(400).json({ 
        message: 'Jesteś już zalogowany. Musisz się najpierw wylogować.' 
      });
    }
    if (lastEntry && lastEntry.type === 'break-start') {
      return res.status(400).json({ 
        message: 'Jesteś na przerwie. Musisz najpierw zakończyć przerwę.' 
      });
    }
  }

  if (type === 'clock-out') {
    if (!lastEntry || lastEntry.type === 'clock-out') {
      return res.status(400).json({ 
        message: 'Nie jesteś zalogowany. Musisz się najpierw zalogować.' 
      });
    }
    if (lastEntry.type === 'break-start') {
      return res.status(400).json({ 
        message: 'Jesteś na przerwie. Musisz najpierw zakończyć przerwę.' 
      });
    }
  }

  if (type === 'break-start') {
    if (!lastEntry || lastEntry.type !== 'clock-in') {
      return res.status(400).json({ 
        message: 'Musisz być zalogowany, aby rozpocząć przerwę.' 
      });
    }
  }

  if (type === 'break-end') {
    if (!lastEntry || lastEntry.type !== 'break-start') {
      return res.status(400).json({ 
        message: 'Nie jesteś na przerwie.' 
      });
    }
  }

  // Create new time entry
  const timeEntry = await TimeEntry.create({
    employee: employee._id,
    user: userId,
    type,
    timestamp: new Date(),
    location: latitude && longitude ? { latitude, longitude } : undefined,
    qrCode,
    notes: notes || '',
    sessionId: type === 'clock-in' ? null : lastEntry?._id
  });

  // Calculate duration if clocking out
  if (type === 'clock-out' && lastEntry && lastEntry.type === 'clock-in') {
    const duration = Math.round((timeEntry.timestamp - lastEntry.timestamp) / 60000); // minutes
    timeEntry.duration = duration;
    await timeEntry.save();
  }

  // Populate employee and user data
  await timeEntry.populate('employee', 'firstName lastName position');
  await timeEntry.populate('user', 'name email');

  const typeLabels = {
    'clock-in': 'Rozpoczęcie pracy',
    'clock-out': 'Zakończenie pracy',
    'break-start': 'Rozpoczęcie przerwy',
    'break-end': 'Zakończenie przerwy'
  };

  return res.status(201).json({
    message: `${typeLabels[type]} zarejestrowane pomyślnie`,
    timeEntry,
    duration: timeEntry.duration > 0 ? timeEntry.duration : null
  });
});

// @desc    Get time entries for current user
// @route   GET /api/time-tracking/my-entries
// @access  Private
const getMyTimeEntries = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { startDate, endDate, limit = 50 } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Find employee linked to this user
  const employee = await Employee.findOne({ user: userId });

  if (!employee) {
    return res.status(404).json({ message: 'Nie znaleziono pracownika powiązanego z tym kontem' });
  }

  const query = { employee: employee._id };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const entries = await TimeEntry.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .populate('employee', 'firstName lastName position')
    .populate('user', 'name email');

  return res.status(200).json({
    count: entries.length,
    entries
  });
});

// @desc    Get current status for user
// @route   GET /api/time-tracking/status
// @access  Private
const getCurrentStatus = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);

  if (!userId) {
    return res.status(401).json({ message: 'Nieautoryzowany' });
  }

  // Find employee linked to this user
  const employee = await Employee.findOne({ user: userId });

  if (!employee) {
    return res.status(404).json({ message: 'Nie znaleziono pracownika powiązanego z tym kontem' });
  }

  // Get the last entry
  const lastEntry = await TimeEntry.findOne({ 
    employee: employee._id 
  })
    .sort({ timestamp: -1 })
    .populate('employee', 'firstName lastName position');

  let status = 'clocked-out';
  let statusLabel = 'Wylogowany';
  let currentSessionStart = null;
  let currentSessionDuration = 0;

  if (lastEntry) {
    if (lastEntry.type === 'clock-in') {
      status = 'clocked-in';
      statusLabel = 'Zalogowany';
      currentSessionStart = lastEntry.timestamp;
      currentSessionDuration = Math.round((Date.now() - lastEntry.timestamp.getTime()) / 60000);
    } else if (lastEntry.type === 'break-start') {
      status = 'on-break';
      statusLabel = 'Na przerwie';
      currentSessionStart = lastEntry.timestamp;
      currentSessionDuration = Math.round((Date.now() - lastEntry.timestamp.getTime()) / 60000);
    }
  }

  return res.status(200).json({
    status,
    statusLabel,
    lastEntry,
    currentSessionStart,
    currentSessionDuration,
    employee: {
      id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position
    }
  });
});

// @desc    Get all time entries (Admin only)
// @route   GET /api/time-tracking/entries
// @access  Private/Admin
const getAllTimeEntries = asyncHandler(async (req, res) => {
  const { employeeId, startDate, endDate, limit = 100 } = req.query;

  const query = {};

  if (employeeId) {
    query.employee = employeeId;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const entries = await TimeEntry.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .populate('employee', 'firstName lastName position')
    .populate('user', 'name email');

  return res.status(200).json({
    count: entries.length,
    entries
  });
});

// @desc    Generate QR code for location
// @route   POST /api/time-tracking/generate-qr
// @access  Private/Admin
const generateQRCode = asyncHandler(async (req, res) => {
  const { locationName, description } = req.body;

  if (!locationName) {
    return res.status(400).json({ message: 'Nazwa lokalizacji jest wymagana' });
  }

  // Generate unique QR code
  const qrCode = `KADRYHR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  return res.status(200).json({
    message: 'Kod QR wygenerowany pomyślnie',
    qrCode,
    locationName,
    description: description || '',
    generatedAt: new Date()
  });
});

// @desc    Delete time entry (Admin only)
// @route   DELETE /api/time-tracking/entries/:id
// @access  Private/Admin
const deleteTimeEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await TimeEntry.findById(id);

  if (!entry) {
    return res.status(404).json({ message: 'Nie znaleziono wpisu' });
  }

  await entry.deleteOne();

  return res.status(200).json({ message: 'Wpis usunięty pomyślnie' });
});

module.exports = {
  scanQRCode,
  getMyTimeEntries,
  getCurrentStatus,
  getAllTimeEntries,
  generateQRCode,
  deleteTimeEntry
};
