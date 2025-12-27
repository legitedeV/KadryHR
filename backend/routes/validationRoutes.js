const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const LaborLawValidator = require('../utils/laborLawValidator');
const ShiftAssignment = require('../models/ShiftAssignment');
const Employee = require('../models/Employee');

const validator = new LaborLawValidator();

/**
 * POST /api/validation/schedule
 * Walidacja całego grafiku
 */
router.post('/schedule', protect, async (req, res) => {
  try {
    const { assignments } = req.body;

    // Fetch employees
    const employeeIds = [...new Set(assignments.map(a => a.employeeId || a.employee))];
    const employees = await Employee.find({ _id: { $in: employeeIds } });

    // Validate
    const result = validator.validateSchedule(assignments, employees);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd walidacji grafiku',
      error: error.message
    });
  }
});

/**
 * POST /api/validation/assignment
 * Walidacja pojedynczego przypisania
 */
router.post('/assignment', protect, async (req, res) => {
  try {
    const { assignment, employeeId, scheduleId } = req.body;

    // Fetch employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie znaleziony' });
    }

    // Fetch existing assignments for this employee in the schedule
    const existingAssignments = await ShiftAssignment.find({
      schedule: scheduleId,
      employee: employeeId
    });

    // Validate
    const result = validator.validateAssignment(assignment, employee, existingAssignments);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Assignment validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd walidacji przypisania',
      error: error.message
    });
  }
});

/**
 * GET /api/validation/rules
 * Pobierz reguły Kodeksu Pracy
 */
router.get('/rules', protect, (req, res) => {
  res.json({
    success: true,
    rules: validator.rules,
    holidays: validator.holidays
  });
});

module.exports = router;
