const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const EmployeeAvailability = require('../models/EmployeeAvailability');
const Employee = require('../models/Employee');

const router = express.Router();

router.use(protect);

/**
 * Pobranie dostępności pracowników
 */
router.get('/', async (req, res, next) => {
  try {
    const { employeeId, status, from, to } = req.query;
    const { role, id: userId } = req.user;

    const query = {};

    // Jeśli user (nie admin), pokaż tylko jego dostępność
    if (role !== 'admin' && employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee || employee.user?.toString() !== userId) {
        return res.status(403).json({ message: 'Brak dostępu' });
      }
      query.employee = employeeId;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    if (from && to) {
      query.$or = [
        { startDate: { $lte: new Date(to) }, endDate: { $gte: new Date(from) } },
      ];
    }

    const availabilities = await EmployeeAvailability.find(query)
      .populate('employee')
      .populate('approvedBy', 'name email')
      .sort({ startDate: -1 });

    res.json(availabilities);
  } catch (err) {
    next(err);
  }
});

/**
 * Utworzenie nowej dostępności
 */
router.post('/', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const {
      employeeId,
      startDate,
      endDate,
      daysOfWeek,
      preferredStartTime,
      preferredEndTime,
      maxHoursPerDay,
      maxHoursPerWeek,
      type,
      notes,
    } = req.body;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Wymagane pola: employeeId, startDate, endDate',
      });
    }

    // Sprawdź czy pracownik istnieje
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie istnieje' });
    }

    // Jeśli user (nie admin), może zgłaszać tylko swoją dostępność
    if (role !== 'admin' && employee.user?.toString() !== userId) {
      return res.status(403).json({ message: 'Brak dostępu' });
    }

    const availability = await EmployeeAvailability.create({
      employee: employeeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      daysOfWeek: daysOfWeek || [1, 2, 3, 4, 5],
      preferredStartTime: preferredStartTime || '08:00',
      preferredEndTime: preferredEndTime || '16:00',
      maxHoursPerDay: maxHoursPerDay || 8,
      maxHoursPerWeek: maxHoursPerWeek || 40,
      type: type || 'available',
      notes: notes || '',
      status: role === 'admin' ? 'approved' : 'pending',
    });

    res.status(201).json(availability);
  } catch (err) {
    next(err);
  }
});

/**
 * Aktualizacja dostępności
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    const availability = await EmployeeAvailability.findById(id).populate('employee');
    if (!availability) {
      return res.status(404).json({ message: 'Dostępność nie istnieje' });
    }

    // Sprawdź uprawnienia
    if (role !== 'admin' && availability.employee.user?.toString() !== userId) {
      return res.status(403).json({ message: 'Brak dostępu' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'employee') {
        availability[key] = updates[key];
      }
    });

    await availability.save();

    res.json(availability);
  } catch (err) {
    next(err);
  }
});

/**
 * Zatwierdzenie/odrzucenie dostępności (tylko admin)
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może zatwierdzać dostępność' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status musi być: approved lub rejected' });
    }

    const availability = await EmployeeAvailability.findById(id);
    if (!availability) {
      return res.status(404).json({ message: 'Dostępność nie istnieje' });
    }

    availability.status = status;
    availability.approvedBy = userId;
    await availability.save();

    res.json(availability);
  } catch (err) {
    next(err);
  }
});

/**
 * Usunięcie dostępności
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    const availability = await EmployeeAvailability.findById(id).populate('employee');
    if (!availability) {
      return res.status(404).json({ message: 'Dostępność nie istnieje' });
    }

    // Sprawdź uprawnienia
    if (role !== 'admin' && availability.employee.user?.toString() !== userId) {
      return res.status(403).json({ message: 'Brak dostępu' });
    }

    await EmployeeAvailability.findByIdAndDelete(id);

    res.json({ message: 'Dostępność usunięta' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
