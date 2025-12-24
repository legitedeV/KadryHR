const express = require('express');
const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { requirePermission, requireAnyPermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

/**
 * GET /api/employees/summary
 * Proste dane do dashboardu
 */
router.get(
  '/summary',
  protect,
  requireAnyPermission(['employees.view', 'dashboard.view'], { allowAdmin: true }),
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
  requirePermission('employees.view', { allowAdmin: true }),
  asyncHandler(async (req, res) => {
    const employees = await Employee.find()
      .populate('user', 'email name')
      .sort({ createdAt: -1 });
    res.json({ employees });
  })
);

/**
 * POST /api/employees
 * Dodanie pracownika z utworzeniem konta użytkownika
 */
router.post(
  '/',
  protect,
  requirePermission('employees.create', { allowAdmin: true }),
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, password, ...employeeData } = req.body;

    // Walidacja email
    if (!email) {
      return res.status(400).json({ message: 'Email jest wymagany' });
    }

    // Sprawdź czy email już istnieje
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Użytkownik z tym adresem email już istnieje' 
      });
    }

    // Generuj losowe hasło jeśli nie podano (8 znaków)
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const userPassword = password || generatePassword();

    // Walidacja hasła
    if (userPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Hasło musi mieć co najmniej 6 znaków' 
      });
    }

    // Utwórz konto użytkownika
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: userPassword,
      role: 'user',
      requirePasswordReset: true, // Wymagaj zmiany hasła przy pierwszym logowaniu
    });

    // Utwórz pracownika z powiązaniem do użytkownika
    const employee = await Employee.create({
      firstName,
      lastName,
      ...employeeData,
      user: user._id,
      companyId: req.user.id, // Przypisz do admina który tworzy
    });

    // TODO: Wyślij email z hasłem tymczasowym
    console.log(`[EMPLOYEE] Utworzono konto dla ${email} z hasłem: ${userPassword}`);

    res.status(201).json({ 
      employee,
      message: `Pracownik dodany. Konto utworzone z emailem: ${email}`,
      temporaryPassword: userPassword, // Zwróć hasło do wyświetlenia adminowi
    });
  })
);

/**
 * GET /api/employees/:id
 * Szczegóły pracownika
 */
router.get(
  '/:id',
  protect,
  requirePermission('employees.view', { allowAdmin: true }),
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
  requirePermission('employees.edit', { allowAdmin: true }),
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
  requirePermission('employees.delete', { allowAdmin: true }),
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
