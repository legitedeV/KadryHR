const ScheduleEntry = require('../models/ScheduleEntry');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const EmployeeAvailability = require('../models/EmployeeAvailability');
const ShiftTemplate = require('../models/ShiftTemplate');
const ScheduleConstraint = require('../models/ScheduleConstraint');
const { createNotification } = require('../utils/notificationService');
const { validateSchedule } = require('../utils/laborLawValidator');
const { calculateScheduleCost, optimizeCosts, forecastCosts } = require('../utils/costCalculator');
const { generateIntelligentSchedule, optimizeExistingSchedule } = require('../utils/scheduleOptimizer');

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

/**
 * Inteligentne generowanie grafiku
 * - uwzględnia dostępność pracowników
 * - prognozy sprzedaży/zapotrzebowania
 * - ograniczenia budżetowe
 * - zgodność z Kodeksem Pracy
 */
exports.generateIntelligentSchedule = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może generować grafik.' });
    }

    const {
      startDate,
      endDate,
      employeeIds,
      shiftTemplateIds,
      constraints = {},
      forecastData = null,
      budget = null,
      autoSave = false,
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Wymagane pola: startDate, endDate',
      });
    }

    // Pobranie pracowników
    const employeeQuery = employeeIds && employeeIds.length > 0
      ? { _id: { $in: employeeIds }, isActive: true }
      : { companyId: userId, isActive: true };
    
    const employees = await Employee.find(employeeQuery);
    
    if (employees.length === 0) {
      return res.status(404).json({ message: 'Brak dostępnych pracowników.' });
    }

    // Pobranie szablonów zmian
    let shiftTemplates;
    if (shiftTemplateIds && shiftTemplateIds.length > 0) {
      shiftTemplates = await ShiftTemplate.find({
        _id: { $in: shiftTemplateIds },
        isActive: true,
      });
    } else {
      shiftTemplates = await ShiftTemplate.find({
        companyId: userId,
        isActive: true,
      });
    }

    // Jeśli brak szablonów, utwórz domyślny
    if (shiftTemplates.length === 0) {
      shiftTemplates = [{
        name: 'Zmiana standardowa',
        shiftType: 'full-day',
        startTime: '08:00',
        endTime: '16:00',
        requiredStaff: 1,
      }];
    }

    // Pobranie dostępności pracowników
    const availabilities = await EmployeeAvailability.find({
      employee: { $in: employees.map(e => e._id) },
      status: 'approved',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    // Pobranie urlopów
    const leaves = await Leave.find({
      employee: { $in: employees.map(e => e._id) },
      status: 'approved',
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    // Generowanie grafiku
    const result = await generateIntelligentSchedule({
      employees,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      shiftTemplates,
      constraints,
      availabilities,
      leaves,
      forecastData,
      budget,
    });

    // Automatyczny zapis jeśli włączony
    if (autoSave && result.schedule.length > 0) {
      const scheduleEntries = result.schedule.map(shift => ({
        ...shift,
        createdBy: userId,
      }));

      const saved = await ScheduleEntry.insertMany(scheduleEntries);
      
      return res.status(201).json({
        ...result,
        saved: saved.length,
        message: `Wygenerowano i zapisano ${saved.length} zmian`,
      });
    }

    res.status(200).json({
      ...result,
      message: `Wygenerowano ${result.schedule.length} zmian (podgląd)`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Walidacja zgodności grafiku z Kodeksem Pracy
 */
exports.validateCompliance = async (req, res, next) => {
  try {
    const { employeeId, from, to } = req.query;

    if (!employeeId) {
      return res.status(400).json({ message: 'Wymagane: employeeId' });
    }

    const query = { employee: employeeId };

    if (from && to) {
      query.date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const shifts = await ScheduleEntry.find(query).sort({ date: 1 });

    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Brak zmian do walidacji' });
    }

    const validation = validateSchedule(shifts);

    res.json({
      employeeId,
      period: { from, to },
      shiftsCount: shifts.length,
      ...validation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Analiza kosztów grafiku
 */
exports.analyzeCosts = async (req, res, next) => {
  try {
    const { from, to, employeeIds } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'Wymagane: from, to' });
    }

    const query = {
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    };

    if (employeeIds) {
      const ids = employeeIds.split(',');
      query.employee = { $in: ids };
    }

    const shifts = await ScheduleEntry.find(query).populate('employee');

    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Brak zmian w podanym okresie' });
    }

    const employees = [...new Set(shifts.map(s => s.employee))];
    const costs = calculateScheduleCost(shifts, employees);

    res.json({
      period: { from, to },
      ...costs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Optymalizacja kosztów grafiku
 */
exports.optimizeScheduleCosts = async (req, res, next) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może optymalizować grafik.' });
    }

    const { from, to, budget } = req.body;

    if (!from || !to || !budget) {
      return res.status(400).json({ message: 'Wymagane: from, to, budget' });
    }

    const shifts = await ScheduleEntry.find({
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    }).populate('employee');

    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Brak zmian do optymalizacji' });
    }

    const employees = [...new Set(shifts.map(s => s.employee))];
    const optimization = optimizeCosts(shifts, employees, budget);

    res.json(optimization);
  } catch (err) {
    next(err);
  }
};

/**
 * Prognoza kosztów na podstawie danych historycznych
 */
exports.forecastScheduleCosts = async (req, res, next) => {
  try {
    const { historicalDays = 30, forecastDays = 30 } = req.query;

    const historicalFrom = new Date();
    historicalFrom.setDate(historicalFrom.getDate() - parseInt(historicalDays));

    const shifts = await ScheduleEntry.find({
      date: { $gte: historicalFrom },
    }).populate('employee');

    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Brak danych historycznych' });
    }

    const employees = [...new Set(shifts.map(s => s.employee))];
    const forecast = forecastCosts(shifts, employees, parseInt(forecastDays));

    res.json(forecast);
  } catch (err) {
    next(err);
  }
};

/**
 * Wykrywanie konfliktów w grafiku
 */
exports.detectConflicts = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'Wymagane: from, to' });
    }

    const shifts = await ScheduleEntry.find({
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    }).populate('employee').sort({ employee: 1, date: 1 });

    const conflicts = [];
    const employeeShifts = {};

    // Grupowanie zmian po pracownikach
    shifts.forEach(shift => {
      const empId = shift.employee._id.toString();
      if (!employeeShifts[empId]) {
        employeeShifts[empId] = [];
      }
      employeeShifts[empId].push(shift);
    });

    // Sprawdzanie konfliktów dla każdego pracownika
    Object.entries(employeeShifts).forEach(([empId, empShifts]) => {
      const validation = validateSchedule(empShifts);
      
      if (!validation.isValid) {
        conflicts.push({
          employeeId: empId,
          employeeName: `${empShifts[0].employee.firstName} ${empShifts[0].employee.lastName}`,
          violations: validation.violations,
        });
      }
    });

    res.json({
      period: { from, to },
      totalShifts: shifts.length,
      employeesChecked: Object.keys(employeeShifts).length,
      conflictsFound: conflicts.length,
      conflicts,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Optymalizacja istniejącego grafiku
 */
exports.optimizeExistingSchedule = async (req, res, next) => {
  try {
    const { role } = req.user || {};
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Tylko administrator może optymalizować grafik.' });
    }

    const { from, to, constraints = {} } = req.body;

    if (!from || !to) {
      return res.status(400).json({ message: 'Wymagane: from, to' });
    }

    const shifts = await ScheduleEntry.find({
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    }).populate('employee');

    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Brak zmian do optymalizacji' });
    }

    const employees = [...new Set(shifts.map(s => s.employee))];
    const optimization = await optimizeExistingSchedule(shifts, employees, constraints);

    res.json(optimization);
  } catch (err) {
    next(err);
  }
};
