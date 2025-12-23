const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const ShiftAssignment = require('../models/ShiftAssignment');
const Employee = require('../models/Employee');

// @desc    Get schedules with optional filters
// @route   GET /api/schedules/v2
// @access  Private
const getSchedules = asyncHandler(async (req, res) => {
  const { month, year, teamId, status } = req.query;
  
  const query = {};
  if (month) query.month = month;
  if (year) query.year = parseInt(year);
  if (teamId) query.teamId = teamId;
  if (status) query.status = status;
  
  const schedules = await Schedule.find(query)
    .populate('createdBy', 'name email')
    .populate('publishedBy', 'name email')
    .sort({ year: -1, month: -1, createdAt: -1 });
  
  return res.status(200).json({
    schedules
  });
});

// @desc    Get single schedule with assignments
// @route   GET /api/schedules/v2/:id
// @access  Private
const getScheduleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schedule = await Schedule.findById(id)
    .populate('createdBy', 'name email')
    .populate('publishedBy', 'name email');
  
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie znaleziony' });
  }
  
  const assignments = await ShiftAssignment.find({ schedule: id })
    .populate('employee', 'firstName lastName position')
    .populate('shiftTemplate', 'name color')
    .sort({ date: 1, employee: 1 });
  
  return res.status(200).json({
    schedule,
    assignments
  });
});

// @desc    Create new schedule
// @route   POST /api/schedules/v2
// @access  Private (Admin)
const createSchedule = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { name, month, year, teamId, notes } = req.body;
  
  if (!name || !month || !year) {
    return res.status(400).json({ 
      message: 'Nazwa, miesiąc i rok są wymagane' 
    });
  }
  
  // Check if schedule already exists for this month
  const existing = await Schedule.findOne({ month, year, teamId });
  if (existing) {
    return res.status(400).json({ 
      message: 'Grafik dla tego miesiąca już istnieje' 
    });
  }
  
  const schedule = await Schedule.create({
    name,
    month,
    year,
    teamId,
    notes,
    createdBy: userId,
    status: 'draft'
  });
  
  await schedule.populate('createdBy', 'name email');
  
  return res.status(201).json({
    message: 'Grafik utworzony pomyślnie',
    schedule
  });
});

// @desc    Update schedule
// @route   PUT /api/schedules/v2/:id
// @access  Private (Admin)
const updateSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, notes, status } = req.body;
  
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie znaleziony' });
  }
  
  if (name) schedule.name = name;
  if (notes !== undefined) schedule.notes = notes;
  if (status) schedule.status = status;
  
  await schedule.save();
  await schedule.populate('createdBy', 'name email');
  
  return res.status(200).json({
    message: 'Grafik zaktualizowany pomyślnie',
    schedule
  });
});

// @desc    Delete schedule
// @route   DELETE /api/schedules/v2/:id
// @access  Private (Admin)
const deleteSchedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie znaleziony' });
  }
  
  // Delete all assignments
  await ShiftAssignment.deleteMany({ schedule: id });
  
  // Delete schedule
  await schedule.deleteOne();
  
  return res.status(200).json({
    message: 'Grafik usunięty pomyślnie'
  });
});

// @desc    Get assignments for schedule
// @route   GET /api/schedules/v2/:id/assignments
// @access  Private
const getAssignments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, employeeId } = req.query;
  
  const query = { schedule: id };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  if (employeeId) {
    query.employee = employeeId;
  }
  
  const assignments = await ShiftAssignment.find(query)
    .populate('employee', 'firstName lastName position')
    .populate('shiftTemplate', 'name color')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .sort({ date: 1, employee: 1 });
  
  return res.status(200).json({
    assignments
  });
});

// @desc    Create assignment
// @route   POST /api/schedules/v2/:id/assignments
// @access  Private (Admin)
const createAssignment = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id: scheduleId } = req.params;
  const { employeeId, date, type, startTime, endTime, shiftTemplateId, notes, color } = req.body;
  
  if (!employeeId || !date || !type) {
    return res.status(400).json({ 
      message: 'Pracownik, data i typ są wymagane' 
    });
  }
  
  if (type === 'shift' && (!startTime || !endTime)) {
    return res.status(400).json({ 
      message: 'Godziny rozpoczęcia i zakończenia są wymagane dla zmian' 
    });
  }
  
  // Check if schedule exists
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie znaleziony' });
  }
  
  // Check if employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Pracownik nie znaleziony' });
  }
  
  // Check if assignment already exists
  const existing = await ShiftAssignment.findOne({
    schedule: scheduleId,
    employee: employeeId,
    date: new Date(date)
  });
  
  if (existing) {
    return res.status(400).json({ 
      message: 'Przypisanie dla tego pracownika i daty już istnieje' 
    });
  }
  
  const assignment = await ShiftAssignment.create({
    schedule: scheduleId,
    employee: employeeId,
    date: new Date(date),
    type,
    startTime,
    endTime,
    shiftTemplate: shiftTemplateId,
    notes,
    color,
    createdBy: userId
  });
  
  await assignment.populate('employee', 'firstName lastName position');
  await assignment.populate('shiftTemplate', 'name color');
  
  return res.status(201).json({
    message: 'Przypisanie utworzone pomyślnie',
    assignment
  });
});

// @desc    Update assignment
// @route   PUT /api/schedules/v2/assignments/:id
// @access  Private (Admin)
const updateAssignment = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id } = req.params;
  const { type, startTime, endTime, shiftTemplateId, notes, color } = req.body;
  
  const assignment = await ShiftAssignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ message: 'Przypisanie nie znalezione' });
  }
  
  if (type) assignment.type = type;
  if (startTime) assignment.startTime = startTime;
  if (endTime) assignment.endTime = endTime;
  if (shiftTemplateId !== undefined) assignment.shiftTemplate = shiftTemplateId;
  if (notes !== undefined) assignment.notes = notes;
  if (color) assignment.color = color;
  assignment.updatedBy = userId;
  
  await assignment.save();
  await assignment.populate('employee', 'firstName lastName position');
  await assignment.populate('shiftTemplate', 'name color');
  
  return res.status(200).json({
    message: 'Przypisanie zaktualizowane pomyślnie',
    assignment
  });
});

// @desc    Delete assignment
// @route   DELETE /api/schedules/v2/assignments/:id
// @access  Private (Admin)
const deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const assignment = await ShiftAssignment.findById(id);
  if (!assignment) {
    return res.status(404).json({ message: 'Przypisanie nie znalezione' });
  }
  
  await assignment.deleteOne();
  
  return res.status(200).json({
    message: 'Przypisanie usunięte pomyślnie'
  });
});

// @desc    Generate schedule (simplified version)
// @route   POST /api/schedules/v2/:id/generate
// @access  Private (Admin)
const generateSchedule = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { id: scheduleId } = req.params;
  const { employeeIds, startDate, endDate, shiftTemplateId, daysOfWeek } = req.body;
  
  if (!employeeIds || !startDate || !endDate) {
    return res.status(400).json({ 
      message: 'Pracownicy, data rozpoczęcia i zakończenia są wymagane' 
    });
  }
  
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie znaleziony' });
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const assignments = [];
  
  // Generate assignments for each day
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    
    // Skip if day is not in daysOfWeek
    if (daysOfWeek && !daysOfWeek.includes(dayOfWeek)) {
      continue;
    }
    
    // Create assignment for each employee
    for (const employeeId of employeeIds) {
      // Check if assignment already exists
      const existing = await ShiftAssignment.findOne({
        schedule: scheduleId,
        employee: employeeId,
        date: new Date(date)
      });
      
      if (!existing) {
        const assignment = await ShiftAssignment.create({
          schedule: scheduleId,
          employee: employeeId,
          date: new Date(date),
          type: 'shift',
          startTime: '08:00',
          endTime: '16:00',
          shiftTemplate: shiftTemplateId,
          createdBy: userId
        });
        assignments.push(assignment);
      }
    }
  }
  
  return res.status(201).json({
    message: `Wygenerowano ${assignments.length} przypisań`,
    count: assignments.length
  });
});

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  generateSchedule
};
