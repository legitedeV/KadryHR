const TimeEntry = require('../models/TimeEntry');
const logger = require('./logger');

const MAX_WORK_HOURS = 10;
const MAX_WORK_MINUTES = MAX_WORK_HOURS * 60;

/**
 * Auto-close sessions that exceed 10 hours
 * This runs periodically to ensure sessions are closed even after server restarts
 */
async function autoCloseExpiredSessions() {
  try {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - (MAX_WORK_MINUTES * 60 * 1000));

    // Find all open clock-in sessions that started more than 10 hours ago
    const expiredSessions = await TimeEntry.find({
      type: 'clock-in',
      endedAt: null,
      timestamp: { $lte: tenHoursAgo }
    }).populate('employee user');

    let closedCount = 0;

    for (const session of expiredSessions) {
      // Double-check that there's no clock-out already
      const existingClockOut = await TimeEntry.findOne({
        employee: session.employee._id,
        type: 'clock-out',
        sessionId: session._id
      });

      if (existingClockOut) {
        // Mark the session as ended to avoid future checks
        session.endedAt = existingClockOut.timestamp;
        await session.save();
        continue;
      }

      // Calculate the exact 10-hour mark
      const autoClockOutTime = new Date(session.timestamp.getTime() + (MAX_WORK_MINUTES * 60 * 1000));

      // Create auto clock-out entry
      await TimeEntry.create({
        employee: session.employee._id,
        user: session.user._id,
        type: 'clock-out',
        timestamp: autoClockOutTime,
        qrCode: 'AUTO-CLOSE-WORKER',
        notes: 'Automatyczne wylogowanie po 10 godzinach pracy (worker)',
        duration: MAX_WORK_MINUTES,
        sessionId: session._id,
        autoClocked: true,
        endReason: 'auto_10h',
        startedAt: session.timestamp,
        endedAt: autoClockOutTime
      });

      // Mark the original session as ended
      session.endedAt = autoClockOutTime;
      await session.save();

      closedCount++;
      logger.info(`Auto-closed session for employee ${session.employee._id}`, {
        sessionId: session._id,
        startTime: session.timestamp,
        endTime: autoClockOutTime
      });
    }

    if (closedCount > 0) {
      logger.success(`Session worker: Auto-closed ${closedCount} expired session(s)`);
    }

    return closedCount;
  } catch (error) {
    logger.error('Error in session worker:', error);
    return 0;
  }
}

/**
 * Check and auto-close a specific session if it exceeds 10 hours
 * This is the "close-on-read" fallback
 */
async function checkAndCloseSession(employeeId) {
  try {
    // Find the last entry for this employee
    const lastEntry = await TimeEntry.findOne({
      employee: employeeId,
      type: 'clock-in',
      endedAt: null
    }).sort({ timestamp: -1 });

    if (!lastEntry) {
      return null;
    }

    const now = Date.now();
    const minutesWorked = Math.round((now - lastEntry.timestamp.getTime()) / 60000);

    if (minutesWorked >= MAX_WORK_MINUTES) {
      // Check if already closed
      const existingClockOut = await TimeEntry.findOne({
        employee: employeeId,
        type: 'clock-out',
        sessionId: lastEntry._id
      });

      if (existingClockOut) {
        lastEntry.endedAt = existingClockOut.timestamp;
        await lastEntry.save();
        return existingClockOut;
      }

      // Calculate the exact 10-hour mark
      const autoClockOutTime = new Date(lastEntry.timestamp.getTime() + (MAX_WORK_MINUTES * 60 * 1000));

      // Create auto clock-out
      const autoClockOut = await TimeEntry.create({
        employee: lastEntry.employee,
        user: lastEntry.user,
        type: 'clock-out',
        timestamp: autoClockOutTime,
        qrCode: 'AUTO-CLOSE-FALLBACK',
        notes: 'Automatyczne wylogowanie po 10 godzinach pracy',
        duration: MAX_WORK_MINUTES,
        sessionId: lastEntry._id,
        autoClocked: true,
        endReason: 'auto_10h',
        startedAt: lastEntry.timestamp,
        endedAt: autoClockOutTime
      });

      // Mark the original session as ended
      lastEntry.endedAt = autoClockOutTime;
      await lastEntry.save();

      logger.info(`Fallback auto-closed session for employee ${employeeId}`, {
        sessionId: lastEntry._id
      });

      return autoClockOut;
    }

    return null;
  } catch (error) {
    logger.error('Error in checkAndCloseSession:', error);
    return null;
  }
}

/**
 * Start the session worker with periodic checks
 */
function startSessionWorker(intervalMinutes = 5) {
  logger.info(`Starting session worker (checking every ${intervalMinutes} minutes)`);
  
  // Run immediately on startup
  autoCloseExpiredSessions();
  
  // Then run periodically
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(autoCloseExpiredSessions, intervalMs);
}

module.exports = {
  autoCloseExpiredSessions,
  checkAndCloseSession,
  startSessionWorker,
  MAX_WORK_MINUTES
};
