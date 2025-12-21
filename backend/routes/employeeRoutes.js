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
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ active: true }).catch(
      () => 0
    );

    res.json({
      totalEmployees,
      activeEmployees,
    });
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
