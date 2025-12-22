const express = require('express');
const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/employees/summary
 * Proste dane do dashboardu
 */
router.get(
  '/summary',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employees = await Employee.find({}, 'monthlySalary hourlyRate hoursPerMonth isActive');

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive !== false).length;

    const totalPayrollAmount = employees.reduce((sum, emp) => {
      const baseSalary =
        (emp.monthlySalary && emp.monthlySalary > 0)
          ? emp.monthlySalary
          : (emp.hourlyRate || 0) * (emp.hoursPerMonth || 160);

      return sum + baseSalary;
    }, 0);

    res.json({
      totalEmployees,
      activeEmployees,
      totalPayrollAmount: Math.round(totalPayrollAmount),
    });
  })
);

// uproszczona lista do wyborów (np. zamiany w grafiku)
router.get(
  '/compact',
  protect,
  asyncHandler(async (req, res) => {
    const employees = await Employee.find(
      {},
      'firstName lastName position isActive'
    ).sort({ firstName: 1 });

    res.json({ employees });
  })
);

/**
 * GET /api/employees/me
 * Dane powiązanego pracownika dla aktualnie zalogowanego użytkownika
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const { id: userId } = req.user || {};

    const employee = await Employee.findOne({ user: userId, isActive: true });

    if (!employee) {
      return res.status(404).json({
        message: 'Brak przypisanego profilu pracownika do tego użytkownika.',
      });
    }

    res.json({ employee });
  })
);

/**
 * GET /api/employees
 * Lista wszystkich pracowników
 */
router.get(
  '/',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ employees });
  })
);

/**
 * POST /api/employees
 * Dodanie pracownika
 */
router.post(
  '/',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.create(req.body);
    res.status(201).json({ employee });
  })
);

/**
 * GET /api/employees/:id
 * Szczegóły pracownika
 */
router.get(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ employee });
  })
);

/**
 * PATCH /api/employees/:id
 * Aktualizacja pracownika
 */
router.patch(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ employee });
  })
);

/**
 * DELETE /api/employees/:id
 * Usunięcie pracownika
 */
router.delete(
  '/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    res.json({ message: 'Pracownik został usunięty.' });
  })
);

module.exports = router;
