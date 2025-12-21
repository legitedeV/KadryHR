const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ScheduleEntry = require('../models/ScheduleEntry');
const { createNotification } = require('../utils/notificationService');

// helper: liczba dni włącznie (YYYY-MM-DD daty)
const countDaysInclusive = (startDate, endDate) => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const diff = e.getTime() - s.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

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
 * Tworzenie wniosku urlopowego.
 * - user: składa wniosek
 * - admin także może (np. w imieniu pracownika)
 */
exports.createLeave = async (req, res, next) => {
  try {
    const { id: userId } = req.user || {};
    const { employeeId, type, startDate, endDate, reason } = req.body;

    if (!employeeId || !type || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Wymagane pola: employeeId, type, startDate, endDate.',
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

    const daysCount = countDaysInclusive(s, e);

    const leave = await Leave.create({
      employee: employeeId,
      type,
      startDate: s,
      endDate: e,
      status: 'pending',
      reason: reason || '',
      daysCount,
      createdBy: userId,
    });

    // Powiadomienie dla pracownika (że wniosek został złożony)
    try {
      if (employee.user) {
        await createNotification(
          employee.user,
          'leave',
          'Złożono wniosek urlopowy',
          `Twój wniosek urlopowy od ${s.toISOString().slice(0, 10)} do ${e
            .toISOString()
            .slice(0, 10)} został złożony i oczekuje na akceptację.`
        );
      }
    } catch (err) {
      console.error('Błąd przy tworzeniu powiadomienia wniosku urlopowego:', err);
    }

    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

/**
 * Akceptacja wniosku urlopowego (tylko admin).
 * - usuwa istniejące zmiany z grafiku dla danego pracownika w zakresie dat
 *   (proste "zastąpienie" – realnie można dodać osobne wpisy typu "off" itp.)
 */
exports.approveLeave = async (req, res, next) => {
  try {
    const { role, id: adminId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może akceptować urlopy.' });
    }

    const { id } = req.params;

    const leave = await Leave.findById(id).populate('employee');
    if (!leave) {
      return res.status(404).json({ message: 'Wniosek urlopowy nie istnieje.' });
    }

    leave.status = 'approved';
    leave.approvedBy = adminId;
    await leave.save();

    const days = iterateDays(leave.startDate, leave.endDate);

    // Proste podejście: usuwamy zmiany z grafiku w tych dniach
    await ScheduleEntry.deleteMany({
      employee: leave.employee._id,
      date: {
        $gte: days[0],
        $lte: days[days.length - 1],
      },
    });

    // powiadom pracownika
    try {
      if (leave.employee && leave.employee.user) {
        await createNotification(
          leave.employee.user,
          'leave',
          'Wniosek urlopowy zaakceptowany',
          `Twój wniosek urlopowy od ${leave.startDate
            .toISOString()
            .slice(0, 10)} do ${leave.endDate.toISOString().slice(0, 10)} został zaakceptowany.`
        );
      }
    } catch (err) {
      console.error('Błąd przy powiadomieniu o akceptacji urlopu:', err);
    }

    res.json(leave);
  } catch (err) {
    next(err);
  }
};

/**
 * Odrzucenie wniosku urlopowego (tylko admin).
 */
exports.rejectLeave = async (req, res, next) => {
  try {
    const { role, id: adminId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może odrzucać urlopy.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const leave = await Leave.findById(id).populate('employee');
    if (!leave) {
      return res.status(404).json({ message: 'Wniosek urlopowy nie istnieje.' });
    }

    leave.status = 'rejected';
    leave.approvedBy = adminId;
    if (reason) {
      leave.reason = reason;
    }
    await leave.save();

    try {
      if (leave.employee && leave.employee.user) {
        await createNotification(
          leave.employee.user,
          'leave',
          'Wniosek urlopowy odrzucony',
          `Twój wniosek urlopowy od ${leave.startDate
            .toISOString()
            .slice(0, 10)} do ${leave.endDate.toISOString().slice(0, 10)} został odrzucony.`
        );
      }
    } catch (err) {
      console.error('Błąd przy powiadomieniu o odrzuceniu urlopu:', err);
    }

    res.json(leave);
  } catch (err) {
    next(err);
  }
};

/**
 * Pobieranie wniosków urlopowych.
 * - admin: wszystkie lub filtrowanie po employeeId
 */
exports.getLeaves = async (req, res, next) => {
  try {
    const { role } = req.user || {};
    const { employeeId, status } = req.query;

    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    // PROSTO: na razie tylko admin ma dostęp do listy
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może przeglądać wnioski urlopowe.' });
    }

    const leaves = await Leave.find(query)
      .populate('employee')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    next(err);
  }
};
