const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const TimeEntry = require('../models/TimeEntry');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { checkAndCloseSession, MAX_WORK_MINUTES } = require('../utils/sessionWorker');

// Maximum work time in hours
const MAX_WORK_HOURS = 10;

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

  // Fallback: Check and auto-close any expired sessions (close-on-read)
  const autoClosedEntry = await checkAndCloseSession(employee._id);
  
  if (autoClosedEntry && type !== 'clock-in') {
    return res.status(200).json({
      message: 'Twoja sesja została automatycznie zakończona po 10 godzinach pracy',
      timeEntry: autoClosedEntry,
      duration: MAX_WORK_MINUTES,
      autoClocked: true
    });
  }

  // Get the last entry for this employee
  const currentLastEntry = await TimeEntry.findOne({ 
    employee: employee._id 
  }).sort({ timestamp: -1 });

  // Validation logic
  if (type === 'clock-in') {
    if (currentLastEntry && currentLastEntry.type === 'clock-in') {
      return res.status(400).json({ 
        message: 'Jesteś już zalogowany. Musisz się najpierw wylogować.' 
      });
    }
    if (currentLastEntry && currentLastEntry.type === 'break-start') {
      return res.status(400).json({ 
        message: 'Jesteś na przerwie. Musisz najpierw zakończyć przerwę.' 
      });
    }
    if (currentLastEntry && currentLastEntry.type === 'break-end') {
      return res.status(400).json({ 
        message: 'Jesteś już zalogowany. Musisz się najpierw wylogować.' 
      });
    }
  }

  if (type === 'clock-out') {
    if (!currentLastEntry || currentLastEntry.type === 'clock-out') {
      return res.status(400).json({ 
        message: 'Nie jesteś zalogowany. Musisz się najpierw zalogować.' 
      });
    }
    if (currentLastEntry.type === 'break-start') {
      return res.status(400).json({ 
        message: 'Jesteś na przerwie. Musisz najpierw zakończyć przerwę.' 
      });
    }
  }

  if (type === 'break-start') {
    if (!currentLastEntry || (currentLastEntry.type !== 'clock-in' && currentLastEntry.type !== 'break-end')) {
      return res.status(400).json({ 
        message: 'Musisz być zalogowany, aby rozpocząć przerwę.' 
      });
    }
  }

  if (type === 'break-end') {
    if (!currentLastEntry || currentLastEntry.type !== 'break-start') {
      return res.status(400).json({ 
        message: 'Nie jesteś na przerwie.' 
      });
    }
  }

  // Find the clock-in entry for this session
  let clockInEntry = null;
  if (type === 'clock-out') {
    clockInEntry = await TimeEntry.findOne({
      employee: employee._id,
      type: 'clock-in',
      _id: { $lte: currentLastEntry._id }
    }).sort({ timestamp: -1 });
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
    sessionId: type === 'clock-in' ? null : (clockInEntry?._id || currentLastEntry?._id),
    startedAt: type === 'clock-in' ? new Date() : (clockInEntry?.timestamp || null),
    endedAt: type === 'clock-out' ? new Date() : null,
    endReason: type === 'clock-out' ? 'manual' : 'manual'
  });

  // Calculate duration if clocking out
  if (type === 'clock-out' && clockInEntry) {
    let duration = Math.round((timeEntry.timestamp - clockInEntry.timestamp) / 60000); // minutes
    
    // Cap duration at MAX_WORK_MINUTES
    if (duration > MAX_WORK_MINUTES) {
      duration = MAX_WORK_MINUTES;
      timeEntry.timestamp = new Date(clockInEntry.timestamp.getTime() + (MAX_WORK_MINUTES * 60000));
      timeEntry.autoClocked = true;
      timeEntry.endReason = 'auto_10h';
      timeEntry.notes = (notes || '') + ' (Czas pracy ograniczony do 10 godzin)';
    }
    
    timeEntry.duration = duration;
    timeEntry.startedAt = clockInEntry.timestamp;
    timeEntry.endedAt = timeEntry.timestamp;
    
    // Mark the clock-in session as ended
    clockInEntry.endedAt = timeEntry.timestamp;
    await clockInEntry.save();
    
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

  // Fallback: Check and auto-close any expired sessions
  await checkAndCloseSession(employee._id);

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
  let timeRemaining = 0;
  let warningLevel = 'none'; // none, warning, critical
  let willAutoClockOut = false;

  if (lastEntry) {
    if (lastEntry.type === 'clock-in' || lastEntry.type === 'break-end') {
      // Find the original clock-in for this session
      const clockInEntry = lastEntry.type === 'clock-in' ? lastEntry : await TimeEntry.findOne({
        employee: employee._id,
        type: 'clock-in',
        timestamp: { $lte: lastEntry.timestamp }
      }).sort({ timestamp: -1 });

      if (clockInEntry) {
        status = lastEntry.type === 'clock-in' ? 'clocked-in' : 'clocked-in';
        statusLabel = 'Zalogowany';
        currentSessionStart = clockInEntry.timestamp;
        currentSessionDuration = Math.round((Date.now() - clockInEntry.timestamp.getTime()) / 60000);
        timeRemaining = MAX_WORK_MINUTES - currentSessionDuration;

        if (currentSessionDuration >= MAX_WORK_MINUTES) {
          willAutoClockOut = true;
          timeRemaining = 0;
          warningLevel = 'critical';
        } else if (currentSessionDuration >= MAX_WORK_MINUTES - 30) { // 30 minutes before limit
          warningLevel = 'critical';
        } else if (currentSessionDuration >= MAX_WORK_MINUTES - 60) { // 1 hour before limit
          warningLevel = 'warning';
        }
      }
    } else if (lastEntry.type === 'break-start') {
      status = 'on-break';
      statusLabel = 'Na przerwie';
      currentSessionStart = lastEntry.timestamp;
      currentSessionDuration = Math.round((Date.now() - lastEntry.timestamp.getTime()) / 60000);
      
      // Find the original clock-in to calculate total work time
      const clockInEntry = await TimeEntry.findOne({
        employee: employee._id,
        type: 'clock-in',
        timestamp: { $lte: lastEntry.timestamp }
      }).sort({ timestamp: -1 });

      if (clockInEntry) {
        const totalSessionDuration = Math.round((Date.now() - clockInEntry.timestamp.getTime()) / 60000);
        timeRemaining = MAX_WORK_MINUTES - totalSessionDuration;

        if (totalSessionDuration >= MAX_WORK_MINUTES) {
          willAutoClockOut = true;
          timeRemaining = 0;
          warningLevel = 'critical';
        } else if (totalSessionDuration >= MAX_WORK_MINUTES - 30) {
          warningLevel = 'critical';
        } else if (totalSessionDuration >= MAX_WORK_MINUTES - 60) {
          warningLevel = 'warning';
        }
      }
    }
  }

  return res.status(200).json({
    status,
    statusLabel,
    lastEntry,
    currentSessionStart,
    currentSessionDuration,
    timeRemaining,
    maxWorkMinutes: MAX_WORK_MINUTES,
    warningLevel,
    willAutoClockOut,
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

// @desc    Auto-close sessions exceeding max work time
// @route   POST /api/time-tracking/auto-close-sessions
// @access  Private/Admin
const autoCloseSessions = asyncHandler(async (req, res) => {
  // Find all employees with open clock-in sessions
  const openSessions = await TimeEntry.aggregate([
    {
      $match: {
        type: { $in: ['clock-in', 'break-end'] }
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$employee',
        lastEntry: { $first: '$ROOT' }
      }
    }
  ]);

  let closedCount = 0;
  const now = Date.now();

  for (const session of openSessions) {
    const lastEntry = session.lastEntry;
    const minutesWorked = Math.round((now - new Date(lastEntry.timestamp).getTime()) / 60000);

    if (minutesWorked >= MAX_WORK_MINUTES) {
      // Find the original clock-in
      const clockInEntry = await TimeEntry.findOne({
        employee: lastEntry.employee,
        type: 'clock-in',
        timestamp: { $lte: lastEntry.timestamp }
      }).sort({ timestamp: -1 });

      if (clockInEntry) {
        // Create auto clock-out
        await TimeEntry.create({
          employee: lastEntry.employee,
          user: lastEntry.user,
          type: 'clock-out',
          timestamp: new Date(clockInEntry.timestamp.getTime() + (MAX_WORK_MINUTES * 60000)),
          qrCode: 'AUTO-CLOSE',
          notes: 'Automatyczne wylogowanie po 10 godzinach pracy',
          duration: MAX_WORK_MINUTES,
          sessionId: clockInEntry._id,
          autoClocked: true
        });

        closedCount++;
      }
    }
  }

  return res.status(200).json({
    message: `Automatycznie zamknięto ${closedCount} sesji`,
    closedCount
  });
});

module.exports = {
  scanQRCode,
  getMyTimeEntries,
  getCurrentStatus,
  getAllTimeEntries,
  generateQRCode,
  deleteTimeEntry,
  autoCloseSessions
};
