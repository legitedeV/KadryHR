const SickLeave = require('../models/SickLeave');
const Employee = require('../models/Employee');
const ScheduleEntry = require('../models/ScheduleEntry');
const { createNotification } = require('../utils/notificationService');

const iterateDays = (startDate, endDate) => {
  const result = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
};

/**
 * Dodanie L4 (tylko admin / kierownik).
 * - usuwa zmiany z grafiku w zakresie dat
 */
exports.createSickLeave = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({
        message: 'Tylko administrator może dodawać zwolnienia lekarskie.',
      });
    }

    const { employeeId, startDate, endDate, certificateNumber, reason } = req.body;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Wymagane pola: employeeId, startDate, endDate.',
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie istnieje.' });
    }

    const s = new Date(startDate);
    const e = new Date(endDate);

    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) {
      return res.status(400).json({
        message: 'Daty są nieprawidłowe. Upewnij się, że startDate <= endDate.',
      });
    }

    const sickLeave = await SickLeave.create({
      employee: employeeId,
      startDate: s,
      endDate: e,
      certificateNumber: certificateNumber || '',
      reason: reason || '',
      createdBy: userId,
    });

    const days = iterateDays(s, e);

    await ScheduleEntry.deleteMany({
      employee: employee._id,
      date: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    try {
      if (employee.user) {
        await createNotification(
          employee.user,
          'sick_leave',
          'Dodano zwolnienie lekarskie',
          `Zarejestrowano zwolnienie lekarskie od ${s
            .toISOString()
            .slice(0, 10)} do ${e.toISOString().slice(0, 10)}.`
        );
      }
    } catch (err) {
      console.error('Błąd przy powiadomieniu o L4:', err);
    }

    res.status(201).json(sickLeave);
  } catch (err) {
    next(err);
  }
};

/**
 * Pobieranie zwolnień lekarskich (na razie: tylko admin).
 */
exports.getSickLeaves = async (req, res, next) => {
  try {
    const { role } = req.user || {};
    const { employeeId } = req.query;

    if (role !== 'admin') {
      return res.status(403).json({
        message: 'Tylko administrator może przeglądać zwolnienia lekarskie.',
      });
    }

    const query = {};
    if (employeeId) {
      query.employee = employeeId;
    }

    const sickLeaves = await SickLeave.find(query)
      .populate('employee')
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.json(sickLeaves);
  } catch (err) {
    next(err);
  }
};
