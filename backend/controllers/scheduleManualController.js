const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const ShiftAssignment = require('../models/ShiftAssignment');
const Employee = require('../models/Employee');

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseMonth(monthParam) {
  if (!MONTH_REGEX.test(monthParam)) {
    const error = new Error('Nieprawidłowy format miesiąca. Użyj YYYY-MM.');
    error.statusCode = 400;
    throw error;
  }

  const [year, month] = monthParam.split('-').map(Number);
  return { year, month: monthParam, monthIndex: month - 1 };
}

function getMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function hasTimeConflict(base, existing) {
  const baseStart = base.type === 'shift' ? getMinutes(base.startTime) : 0;
  const baseEnd = base.type === 'shift' ? getMinutes(base.endTime) : 24 * 60;

  const otherStart = existing.type === 'shift' ? getMinutes(existing.startTime) : 0;
  const otherEnd = existing.type === 'shift' ? getMinutes(existing.endTime) : 24 * 60;

  return Math.max(baseStart, otherStart) < Math.min(baseEnd, otherEnd);
}

async function ensureSchedule(month, userId) {
  const { month: monthLabel, year } = parseMonth(month);
  let schedule = await Schedule.findOne({ month: monthLabel });

  if (!schedule) {
    schedule = await Schedule.create({
      month: monthLabel,
      year,
      name: `Grafik ${monthLabel}`,
      createdBy: userId,
      status: 'draft'
    });
  }

  return schedule;
}

const getScheduleForMonth = asyncHandler(async (req, res) => {
  const { month } = req.params;
  const schedule = await ensureSchedule(month, req.userId);

  const shifts = await ShiftAssignment.find({ schedule: schedule._id })
    .populate('employee', 'firstName lastName position')
    .sort({ date: 1 });

  res.json({ schedule, shifts });
});

const upsertScheduleForMonth = asyncHandler(async (req, res) => {
  const { month } = req.params;
  const { name, notes, status } = req.body;
  const schedule = await ensureSchedule(month, req.userId);

  if (name) schedule.name = name;
  if (notes !== undefined) schedule.notes = notes;
  if (status) schedule.status = status;

  await schedule.save();

  res.json({ schedule });
});

const createShiftForMonth = asyncHandler(async (req, res) => {
  const { month } = req.params;
  const { employeeId, date, type = 'shift', startTime, endTime, notes, breakMinutes = 0, allowConflict } = req.body;

  if (!employeeId || !date) {
    return res.status(400).json({ message: 'Pracownik i data są wymagane' });
  }

  const schedule = await ensureSchedule(month, req.userId);

  const targetDate = new Date(date);
  const isoMonth = targetDate.toISOString().slice(0, 7);
  if (isoMonth !== month) {
    return res.status(400).json({ message: 'Data nie należy do wybranego miesiąca' });
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Pracownik nie znaleziony' });
  }

  if (type === 'shift') {
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Godziny rozpoczęcia i zakończenia są wymagane' });
    }

    if (getMinutes(endTime) <= getMinutes(startTime)) {
      return res.status(400).json({ message: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia' });
    }
  }

  const sameDayAssignments = await ShiftAssignment.find({
    schedule: schedule._id,
    employee: employeeId,
    date: targetDate
  });

  if (sameDayAssignments.length && !allowConflict) {
    const conflict = sameDayAssignments.find((existing) => hasTimeConflict({ type, startTime, endTime }, existing));
    if (conflict) {
      return res.status(409).json({
        message: 'Konflikt zmian dla tego dnia',
        conflicts: sameDayAssignments.map((item) => ({
          id: item._id,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime
        }))
      });
    }
  }

  const shift = await ShiftAssignment.create({
    schedule: schedule._id,
    employee: employeeId,
    date: targetDate,
    type,
    startTime,
    endTime,
    notes,
    breakMinutes,
    createdBy: req.userId
  });

  await shift.populate('employee', 'firstName lastName position');

  res.status(201).json({ shift });
});

const updateShiftForMonth = asyncHandler(async (req, res) => {
  const { month, shiftId } = req.params;
  const { employeeId, date, type, startTime, endTime, notes, breakMinutes, allowConflict } = req.body;

  const shift = await ShiftAssignment.findById(shiftId);
  if (!shift) {
    return res.status(404).json({ message: 'Zmiana nie istnieje' });
  }

  const schedule = await ensureSchedule(month, req.userId);
  if (String(shift.schedule) !== String(schedule._id)) {
    return res.status(400).json({ message: 'Zmiana nie należy do wskazanego miesiąca' });
  }

  if (employeeId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Pracownik nie znaleziony' });
    }
    shift.employee = employeeId;
  }

  if (date) {
    const targetDate = new Date(date);
    if (targetDate.toISOString().slice(0, 7) !== month) {
      return res.status(400).json({ message: 'Data nie należy do wybranego miesiąca' });
    }
    shift.date = targetDate;
  }

  if (type) shift.type = type;
  if (notes !== undefined) shift.notes = notes;
  if (breakMinutes !== undefined) shift.breakMinutes = breakMinutes;
  if (startTime) shift.startTime = startTime;
  if (endTime) shift.endTime = endTime;

  if (shift.type === 'shift') {
    if (!shift.startTime || !shift.endTime) {
      return res.status(400).json({ message: 'Zmiana wymaga godzin start/end' });
    }

    if (getMinutes(shift.endTime) <= getMinutes(shift.startTime)) {
      return res.status(400).json({ message: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia' });
    }
  }

  const sameDayAssignments = await ShiftAssignment.find({
    schedule: shift.schedule,
    employee: shift.employee,
    date: shift.date,
    _id: { $ne: shift._id }
  });

  if (sameDayAssignments.length && !allowConflict) {
    const conflict = sameDayAssignments.find((existing) => hasTimeConflict(shift, existing));
    if (conflict) {
      return res.status(409).json({
        message: 'Konflikt zmian dla tego dnia',
        conflicts: sameDayAssignments.map((item) => ({
          id: item._id,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime
        }))
      });
    }
  }

  await shift.save();
  await shift.populate('employee', 'firstName lastName position');

  res.json({ shift });
});

const deleteShiftForMonth = asyncHandler(async (req, res) => {
  const { month, shiftId } = req.params;
  const schedule = await ensureSchedule(month, req.userId);

  const shift = await ShiftAssignment.findOne({ _id: shiftId, schedule: schedule._id });
  if (!shift) {
    return res.status(404).json({ message: 'Zmiana nie istnieje' });
  }

  await shift.deleteOne();
  res.json({ message: 'Zmiana usunięta' });
});

module.exports = {
  getScheduleForMonth,
  upsertScheduleForMonth,
  createShiftForMonth,
  updateShiftForMonth,
  deleteShiftForMonth
};
