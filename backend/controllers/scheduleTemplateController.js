const asyncHandler = require('express-async-handler');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const ShiftAssignment = require('../models/ShiftAssignment');
const Schedule = require('../models/Schedule');

const getCompanyId = (user = {}) => user.companyId || user.id;

const normalizeAssignment = (assignment) => {
  if (!assignment || !assignment.employeeId || !assignment.date) {
    return null;
  }

  const normalizedDate = new Date(assignment.date);
  if (Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  return {
    employee: assignment.employeeId,
    date: normalizedDate,
    type: assignment.type || 'shift',
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    shiftTemplate: assignment.shiftTemplateId,
    notes: assignment.notes,
    color: assignment.color
  };
};

// @route GET /api/schedule-templates
const getTemplates = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req.user);

  const templates = await ScheduleTemplate.find({ company: companyId })
    .sort({ createdAt: -1 })
    .select('name month year createdAt')
    .lean();

  res.json({ templates });
});

// @route GET /api/schedule-templates/:id
const getTemplateById = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req.user);
  const { id } = req.params;

  const template = await ScheduleTemplate.findOne({ _id: id, company: companyId })
    .populate('assignments.employee', 'firstName lastName position')
    .populate('assignments.shiftTemplate', 'name color startTime endTime')
    .lean();

  if (!template) {
    return res.status(404).json({ message: 'Szablon nie został znaleziony' });
  }

  res.json({ template });
});

// @route POST /api/schedule-templates
const createTemplate = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const companyId = getCompanyId(req.user);
  const { name, assignments = [], month, year } = req.body || {};

  if (!name) {
    return res.status(400).json({ message: 'Nazwa szablonu jest wymagana' });
  }

  if (!assignments.length) {
    return res.status(400).json({ message: 'Brak danych grafiku do zapisania' });
  }

  const normalizedAssignments = assignments
    .map(normalizeAssignment)
    .filter(Boolean);

  if (!normalizedAssignments.length) {
    return res.status(400).json({ message: 'Nie udało się przetworzyć przypisań' });
  }

  const template = await ScheduleTemplate.create({
    name: name.trim(),
    company: companyId,
    createdBy: userId,
    month,
    year,
    assignments: normalizedAssignments
  });

  res.status(201).json({ template });
});

// @route PUT /api/schedule-templates/:id
const updateTemplate = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req.user);
  const { id } = req.params;
  const { name } = req.body;

  const template = await ScheduleTemplate.findOne({ _id: id, company: companyId });
  if (!template) {
    return res.status(404).json({ message: 'Szablon nie został znaleziony' });
  }

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ message: 'Nazwa szablonu nie może być pusta' });
    }
    template.name = name.trim();
  }

  await template.save();

  res.json({ template });
});

// @route DELETE /api/schedule-templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req.user);
  const { id } = req.params;

  const template = await ScheduleTemplate.findOne({ _id: id, company: companyId });
  if (!template) {
    return res.status(404).json({ message: 'Szablon nie został znaleziony' });
  }

  await template.deleteOne();

  res.json({ message: 'Szablon usunięty' });
});

// @route POST /api/schedule-templates/:id/apply
const applyTemplate = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req.user);
  const { id } = req.params;
  const { scheduleId, targetMonth, mode = 'overwrite' } = req.body || {};

  if (!scheduleId || !targetMonth) {
    return res.status(400).json({ message: 'Brakuje identyfikatora grafiku lub miesiąca docelowego' });
  }

  const [yearStr, monthStr] = targetMonth.split('-');
  const targetYear = Number(yearStr);
  const targetMonthIndex = Number(monthStr) - 1;

  if (Number.isNaN(targetYear) || Number.isNaN(targetMonthIndex)) {
    return res.status(400).json({ message: 'Nieprawidłowy format miesiąca docelowego' });
  }

  const template = await ScheduleTemplate.findOne({ _id: id, company: companyId });
  if (!template) {
    return res.status(404).json({ message: 'Szablon nie został znaleziony' });
  }

  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik docelowy nie istnieje' });
  }

  const templateAssignments = template.assignments || [];
  if (!templateAssignments.length) {
    return res.status(400).json({ message: 'Szablon nie zawiera żadnych zmian' });
  }

  const existingAssignments = await ShiftAssignment.find({ schedule: scheduleId }).select('employee date');
  const existingKeys = new Set(
    existingAssignments.map((a) => `${a.employee.toString()}-${new Date(a.date).toISOString().split('T')[0]}`)
  );

  if (mode === 'overwrite') {
    await ShiftAssignment.deleteMany({ schedule: scheduleId });
  }

  const toInsert = [];

  templateAssignments.forEach((assignment) => {
    const day = new Date(assignment.date).getDate();
    const targetDate = new Date(targetYear, targetMonthIndex, day);
    const dateStr = targetDate.toISOString().split('T')[0];
    const key = `${assignment.employee.toString()}-${dateStr}`;

    if (mode === 'merge' && existingKeys.has(key)) {
      return;
    }

    toInsert.push({
      schedule: scheduleId,
      employee: assignment.employee,
      date: targetDate,
      type: assignment.type,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      shiftTemplate: assignment.shiftTemplate,
      notes: assignment.notes,
      color: assignment.color,
      createdBy: req.user?.id
    });
  });

  if (toInsert.length > 0) {
    await ShiftAssignment.insertMany(toInsert);
  }

  const assignments = await ShiftAssignment.find({ schedule: scheduleId })
    .populate('employee', 'firstName lastName position')
    .populate('shiftTemplate', 'name color')
    .sort({ date: 1, employee: 1 });

  res.json({ message: 'Szablon zastosowany', schedule, assignments });
});

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate
};
