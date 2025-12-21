const ScheduleEntry = require('../models/ScheduleEntry');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/notificationService');

// prosty helper do konwersji "HH:MM" -> minuty od północy
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const buildMonthRange = (monthInput) => {
  // monthInput w formacie YYYY-MM
  const [yearStr, monthStr] = String(monthInput || '').split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  const start = new Date(year, monthIndex, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, monthIndex + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Tworzenie lub aktualizacja pojedynczego wpisu grafiku.
 * - tylko admin
 * - walidacja:
 *   - startTime < endTime
 *   - brak nakładania się zmian w tym samym dniu dla pracownika
 */
exports.createOrUpdateScheduleEntry = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może edytować grafik.' });
    }

    const {
      entryId,
      employeeId,
      date,
      startTime,
      endTime,
      type,
      notes,
    } = req.body;

    if (!employeeId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Wymagane pola: employeeId, date, startTime, endTime.',
      });
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({
        message: 'Godziny są nieprawidłowe. Upewnij się, że startTime < endTime i format HH:MM.',
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie istnieje.' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // sprawdź czy istnieje kolizja na tym samym dniu
    const query = {
      employee: employeeId,
      date: targetDate,
    };

    if (entryId) {
      query._id = { $ne: entryId };
    }

    const existingEntries = await ScheduleEntry.find(query);

    const hasOverlap = existingEntries.some((entry) => {
      const existingStart = toMinutes(entry.startTime);
      const existingEnd = toMinutes(entry.endTime);
      // klasyczne sprawdzenie nakładania przedziałów czasowych
      return start < existingEnd && end > existingStart;
    });

    if (hasOverlap) {
      return res.status(400).json({
        message: 'Zmiana nakłada się z inną zmianą pracownika w tym dniu.',
      });
    }

    let scheduleEntry;

    if (entryId) {
      scheduleEntry = await ScheduleEntry.findById(entryId);
      if (!scheduleEntry) {
        return res.status(404).json({ message: 'Wpis grafiku nie istnieje.' });
      }

      scheduleEntry.employee = employeeId;
      scheduleEntry.date = targetDate;
      scheduleEntry.startTime = startTime;
      scheduleEntry.endTime = endTime;
      scheduleEntry.type = type || scheduleEntry.type;
      scheduleEntry.notes = notes || '';
      scheduleEntry.updatedBy = userId;

      await scheduleEntry.save();
    } else {
      scheduleEntry = await ScheduleEntry.create({
        employee: employeeId,
        date: targetDate,
        startTime,
        endTime,
        type: type || 'regular',
        notes: notes || '',
        createdBy: userId,
      });
    }

    // próba powiadomienia użytkownika powiązanego z pracownikiem (jeśli istnieje pole user)
    try {
      if (employee && employee.user) {
        await createNotification(
          employee.user,
          'schedule',
          'Zaktualizowano grafik pracy',
          `Twój grafik na dzień ${targetDate.toISOString().slice(0, 10)} został zaktualizowany.`
        );
      }
    } catch (err) {
      console.error('Błąd przy tworzeniu powiadomienia grafiku:', err);
    }

    res.status(200).json(scheduleEntry);
  } catch (err) {
    next(err);
  }
};

/**
 * Pobranie grafiku:
 * - filtr: employeeId, from, to
 * - jeśli brak filtrów daty, domyślnie ostatnie 30 dni + 30 dni w przód
 */
exports.getSchedule = async (req, res, next) => {
  try {
    const { employeeId, from, to } = req.query;

    const query = {};

    if (employeeId) {
      query.employee = employeeId;
    }

    const now = new Date();
    let fromDate = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let toDate = to ? new Date(to) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    query.date = { $gte: fromDate, $lte: toDate };

    const entries = await ScheduleEntry.find(query)
      .populate('employee')
      .sort({ date: 1, startTime: 1 });

    res.json(entries);
  } catch (err) {
    next(err);
  }
};

exports.createMonthlyTemplate = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może generować grafik.' });
    }

    const { month, employeeIds, startTime, endTime, daysOfWeek } = req.body || {};

    if (!month || !startTime || !endTime || !Array.isArray(employeeIds)) {
      return res.status(400).json({
        message: 'Wymagane pola: month (YYYY-MM), employeeIds[], startTime, endTime.',
      });
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(endMinutes) ||
      startMinutes >= endMinutes
    ) {
      return res
        .status(400)
        .json({ message: 'Godziny są nieprawidłowe lub start >= end.' });
    }

    const monthRange = buildMonthRange(month);
    if (!monthRange) {
      return res
        .status(400)
        .json({ message: 'Parametr month musi mieć format YYYY-MM.' });
    }

    const dayWhitelist = Array.isArray(daysOfWeek) && daysOfWeek.length
      ? daysOfWeek
      : [1, 2, 3, 4, 5];

    const employees = await Employee.find({ _id: { $in: employeeIds } });
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Brak wskazanych pracowników.' });
    }

    const existing = await ScheduleEntry.find({
      employee: { $in: employeeIds },
      date: { $gte: monthRange.start, $lte: monthRange.end },
    });

    const newEntries = [];
    const cursor = new Date(monthRange.start);

    while (cursor <= monthRange.end) {
      const dayIndex = cursor.getDay();
      const isAllowed = dayWhitelist.includes(dayIndex);

      if (isAllowed) {
        employees.forEach((emp) => {
          const hasOverlap = existing.some((entry) => {
            const sameEmployee = String(entry.employee) === String(emp._id);
            const sameDay = new Date(entry.date).setHours(0, 0, 0, 0) === cursor.setHours(0, 0, 0, 0);
            if (!sameEmployee || !sameDay) return false;

            const existingStart = toMinutes(entry.startTime);
            const existingEnd = toMinutes(entry.endTime);
            return startMinutes < existingEnd && endMinutes > existingStart;
          });

          if (!hasOverlap) {
            newEntries.push({
              employee: emp._id,
              date: new Date(cursor),
              startTime,
              endTime,
              type: 'regular',
              notes: 'Grafik miesięczny',
              createdBy: userId,
            });
          }
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    const inserted = newEntries.length ? await ScheduleEntry.insertMany(newEntries) : [];

    res.status(201).json({
      created: inserted.length,
      month,
      range: monthRange,
    });
  } catch (err) {
    next(err);
  }
};
