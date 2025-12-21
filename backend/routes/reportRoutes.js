const express = require('express');
const asyncHandler = require('express-async-handler');
const WorktimeEntry = require('../models/WorktimeEntry');
const Employee = require('../models/Employee');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Tylko administrator ma dostęp do raportów
const adminOnly = [protect, requireRole('admin')];

/**
 * GET /api/reports/worktime
 *
 * Query params:
 *  - from (YYYY-MM-DD, opcjonalne)
 *  - to   (YYYY-MM-DD, opcjonalne)
 *  - employeeId (opcjonalne)
 *
 * Zwraca listę wpisów czasu pracy + podstawowe sumy godzin.
 */
router.get(
  '/worktime',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const { from, to, employeeId } = req.query;

    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = new Date(from);
      }
      if (to) {
        // koniec dnia "to"
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (employeeId) {
      filter.employee = employeeId;
    }

    const entries = await WorktimeEntry.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName email position',
        model: Employee,
      })
      .sort({ date: 1 });

    // prosta agregacja godzin
    const summaryByEmployee = {};

    for (const entry of entries) {
      const empId = entry.employee?._id?.toString() || 'unknown';

      if (!summaryByEmployee[empId]) {
        summaryByEmployee[empId] = {
          employeeId: empId,
          employeeName: entry.employee
            ? `${entry.employee.firstName} ${entry.employee.lastName}`
            : 'Nieznany pracownik',
          totalHours: 0,
          totalOvertimeHours: 0,
        };
      }

      const hours = entry.hours || 0;
      const overtime = entry.overtimeHours || 0;

      summaryByEmployee[empId].totalHours += hours;
      summaryByEmployee[empId].totalOvertimeHours += overtime;
    }

    res.json({
      entries,
      summary: Object.values(summaryByEmployee),
      filters: {
        from: from || null,
        to: to || null,
        employeeId: employeeId || null,
      },
    });
  })
);

/**
 * (Opcjonalny prosty healthcheck raportów)
 * GET /api/reports/health
 */
router.get(
  '/health',
  ...adminOnly,
  asyncHandler(async (req, res) => {
    res.json({ message: 'Reports API działa' });
  })
);

module.exports = router;
