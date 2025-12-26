const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission, requireAnyPermission } = require('../middleware/permissionMiddleware');

const router = express.Router();

const resolveOrganizationId = (req) => {
  if (req.user?.organizationId) {
    return req.user.organizationId;
  }
  return req.user?.companyId;
};

const ensureOrganizationAccess = (doc, orgId) => {
  if (!doc) return false;
  if (doc.organization && doc.organization.toString() === orgId) return true;
  if (doc.companyId && doc.companyId.toString() === orgId) return true;
  return false;
};

/**
 * GET /api/employees/summary
 * Proste dane do dashboardu
 */
router.get(
  '/summary',
  protect,
  requireAnyPermission(['employees.view', 'dashboard.view'], { allowAdmin: true }),
  asyncHandler(async (req, res) => {
    const organizationId = resolveOrganizationId(req);
    const organizationFilter = organizationId
      ? {
          $or: [
            { organization: new mongoose.Types.ObjectId(organizationId) },
            { companyId: new mongoose.Types.ObjectId(organizationId) },
          ],
        }
      : {};

    const employees = await Employee.find(
      organizationFilter,
      'monthlySalary hourlyRate hoursPerMonth isActive'
    );

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.isActive !== false).length;

    const totalPayrollAmount = employees.reduce((sum, emp) => {
      const baseSalary =
        emp.monthlySalary && emp.monthlySalary > 0
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
    const organizationId = resolveOrganizationId(req);
    const organizationFilter = organizationId
      ? {
          $or: [
            { organization: new mongoose.Types.ObjectId(organizationId) },
            { companyId: new mongoose.Types.ObjectId(organizationId) },
          ],
        }
      : {};

    const employees = await Employee.find(
      organizationFilter,
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
    const organizationId = resolveOrganizationId(req);

    const employee = await Employee.findOne({
      user: userId,
      organization: organizationId,
      isActive: true,
    });

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
 * Lista wszystkich pracowników z paginacją
 */
router.get(
  '/',
  protect,
  requirePermission('employees.view', { allowAdmin: true }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, search, status } = req.query;
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        message: 'Nie znaleziono organizacji przypisanej do użytkownika.',
      });
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Build query
    const query = {
      $or: [
        { organization: orgObjectId },
        { companyId: orgObjectId },
      ],
    };

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Search by name or position
    if (search) {
      query.$or.push(
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      );
    }

    // Calculate pagination
    const parsedLimit = Math.max(1, Math.min(500, parseInt(limit, 10) || 100));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Execute query with pagination
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('user', 'email name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Employee.countDocuments(query),
    ]);

    res.json({
      employees,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
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
    const organizationId = resolveOrganizationId(req);

    if (!organizationId) {
      return res.status(400).json({
        message: 'Nie znaleziono organizacji przypisanej do użytkownika.',
      });
    }

    const organization = await Organization.findById(organizationId);
    if (!organization || organization.isActive === false) {
      return res.status(403).json({
        message: 'Organizacja jest nieaktywna lub nie istnieje.',
      });
    }

    // Walidacja email
    if (!email) {
      return res.status(400).json({ message: 'Email jest wymagany' });
    }

    // Sprawdź czy email już istnieje
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'Użytkownik z tym adresem email już istnieje',
      });
    }

    // Generuj losowe hasło jeśli nie podano (8 znaków)
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let generated = '';
      for (let i = 0; i < 8; i++) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return generated;
    };

    const userPassword = password || generatePassword();

    // Walidacja hasła
    if (userPassword.length < 6) {
      return res.status(400).json({
        message: 'Hasło musi mieć co najmniej 6 znaków',
      });
    }

    // Utwórz konto użytkownika
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: userPassword,
      role: 'user',
      organization: organization._id,
      requirePasswordReset: true, // Wymagaj zmiany hasła przy pierwszym logowaniu
    });

    // Utwórz pracownika z powiązaniem do użytkownika
    const employee = await Employee.create({
      firstName,
      lastName,
      ...employeeData,
      user: user._id,
      organization: organization._id,
      companyId: organization._id,
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
    const organizationId = resolveOrganizationId(req);
    const employee = await Employee.findById(req.params.id).populate('user', 'email name');

    if (!employee || !ensureOrganizationAccess(employee, organizationId)) {
      return res.status(404).json({ message: 'Pracownik o podanym ID nie istnieje.' });
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
    const organizationId = resolveOrganizationId(req);
    const updateData = { ...req.body };

    if (updateData.organization || updateData.companyId) {
      delete updateData.organization;
      delete updateData.companyId;
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee || !ensureOrganizationAccess(employee, organizationId)) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    Object.assign(employee, updateData);
    await employee.save();

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
    const organizationId = resolveOrganizationId(req);
    const employee = await Employee.findById(req.params.id);

    if (!employee || !ensureOrganizationAccess(employee, organizationId)) {
      return res
        .status(404)
        .json({ message: 'Pracownik o podanym ID nie istnieje.' });
    }

    await employee.deleteOne();

    res.json({ message: 'Pracownik został usunięty.' });
  })
);

module.exports = router;
