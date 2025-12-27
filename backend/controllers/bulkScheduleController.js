const asyncHandler = require('express-async-handler');
const ShiftAssignment = require('../models/ShiftAssignment');
const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const ShiftTemplate = require('../models/ShiftTemplate');

/**
 * Bulk create shift assignments
 * POST /api/schedule/bulk-create
 */
exports.bulkCreateAssignments = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { scheduleId, assignments } = req.body;

  if (!scheduleId || !assignments || !Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ 
      message: 'ID grafiku i tablica przypisań są wymagane' 
    });
  }

  // Verify schedule exists
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: 'Grafik nie istnieje' });
  }

  // Validate all assignments
  const validatedAssignments = [];
  const errors = [];

  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    
    if (!assignment.employeeId || !assignment.date || !assignment.shiftTemplateId) {
      errors.push({
        index: i,
        message: 'Brak wymaganych pól: employeeId, date, shiftTemplateId'
      });
      continue;
    }

    // Verify employee exists
    const employee = await Employee.findById(assignment.employeeId);
    if (!employee) {
      errors.push({
        index: i,
        message: `Pracownik ${assignment.employeeId} nie istnieje`
      });
      continue;
    }

    // Verify shift template exists
    const shiftTemplate = await ShiftTemplate.findById(assignment.shiftTemplateId);
    if (!shiftTemplate) {
      errors.push({
        index: i,
        message: `Szablon zmiany ${assignment.shiftTemplateId} nie istnieje`
      });
      continue;
    }

    validatedAssignments.push({
      schedule: scheduleId,
      employee: assignment.employeeId,
      date: assignment.date,
      shiftTemplate: assignment.shiftTemplateId,
      type: assignment.type || 'shift',
      startTime: assignment.startTime || shiftTemplate.startTime,
      endTime: assignment.endTime || shiftTemplate.endTime,
      notes: assignment.notes,
      color: assignment.color || shiftTemplate.color,
      breaks: assignment.breaks || shiftTemplate.breaks,
      createdBy: userId
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Niektóre przypisania są nieprawidłowe',
      errors,
      validCount: validatedAssignments.length,
      errorCount: errors.length
    });
  }

  // Create all assignments
  const created = await ShiftAssignment.insertMany(validatedAssignments);

  res.status(201).json({
    message: `Utworzono ${created.length} przypisań`,
    count: created.length,
    assignments: created
  });
});

/**
 * Bulk update shift assignments
 * PUT /api/schedule/bulk-update
 */
exports.bulkUpdateAssignments = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { assignmentIds, updates } = req.body;

  if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return res.status(400).json({ 
      message: 'Tablica ID przypisań jest wymagana' 
    });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ 
      message: 'Obiekt aktualizacji jest wymagany' 
    });
  }

  // Allowed fields to update
  const allowedFields = [
    'shiftTemplateId', 'startTime', 'endTime', 'notes', 
    'color', 'type', 'breaks', 'status'
  ];

  const updateData = { updatedBy: userId };
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      if (key === 'shiftTemplateId') {
        updateData.shiftTemplate = updates[key];
      } else {
        updateData[key] = updates[key];
      }
    }
  });

  // Update all assignments
  const result = await ShiftAssignment.updateMany(
    { _id: { $in: assignmentIds } },
    { $set: updateData }
  );

  res.json({
    message: `Zaktualizowano ${result.modifiedCount} przypisań`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});

/**
 * Bulk delete shift assignments
 * DELETE /api/schedule/bulk-delete
 */
exports.bulkDeleteAssignments = asyncHandler(async (req, res) => {
  const { assignmentIds } = req.body;

  if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return res.status(400).json({ 
      message: 'Tablica ID przypisań jest wymagana' 
    });
  }

  const result = await ShiftAssignment.deleteMany({
    _id: { $in: assignmentIds }
  });

  res.json({
    message: `Usunięto ${result.deletedCount} przypisań`,
    deletedCount: result.deletedCount
  });
});

/**
 * Copy shift to another date/employee
 * POST /api/schedule/copy-shift
 */
exports.copyShift = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { assignmentId, targetDate, targetEmployeeId } = req.body;

  if (!assignmentId) {
    return res.status(400).json({ message: 'ID przypisania jest wymagane' });
  }

  if (!targetDate && !targetEmployeeId) {
    return res.status(400).json({ 
      message: 'Wymagana jest data docelowa lub ID pracownika docelowego' 
    });
  }

  // Get source assignment
  const sourceAssignment = await ShiftAssignment.findById(assignmentId)
    .populate('shiftTemplate');

  if (!sourceAssignment) {
    return res.status(404).json({ message: 'Przypisanie nie istnieje' });
  }

  // Create new assignment
  const newAssignment = new ShiftAssignment({
    schedule: sourceAssignment.schedule,
    employee: targetEmployeeId || sourceAssignment.employee,
    date: targetDate || sourceAssignment.date,
    shiftTemplate: sourceAssignment.shiftTemplate?._id,
    type: sourceAssignment.type,
    startTime: sourceAssignment.startTime,
    endTime: sourceAssignment.endTime,
    notes: sourceAssignment.notes,
    color: sourceAssignment.color,
    breaks: sourceAssignment.breaks,
    createdBy: userId
  });

  await newAssignment.save();
  await newAssignment.populate('employee', 'firstName lastName');
  await newAssignment.populate('shiftTemplate', 'name color');

  res.status(201).json({
    message: 'Zmiana została skopiowana',
    assignment: newAssignment
  });
});

/**
 * Duplicate week schedule
 * POST /api/schedule/duplicate-week
 */
exports.duplicateWeek = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { scheduleId, sourceWeekStart, targetWeekStart } = req.body;

  if (!scheduleId || !sourceWeekStart || !targetWeekStart) {
    return res.status(400).json({ 
      message: 'ID grafiku, data źródłowa i docelowa są wymagane' 
    });
  }

  const sourceStart = new Date(sourceWeekStart);
  const sourceEnd = new Date(sourceStart);
  sourceEnd.setDate(sourceEnd.getDate() + 7);

  const targetStart = new Date(targetWeekStart);

  // Get all assignments from source week
  const sourceAssignments = await ShiftAssignment.find({
    schedule: scheduleId,
    date: { $gte: sourceStart, $lt: sourceEnd }
  }).populate('shiftTemplate');

  if (sourceAssignments.length === 0) {
    return res.status(404).json({ 
      message: 'Brak przypisań w źródłowym tygodniu' 
    });
  }

  // Calculate day offset
  const dayOffset = Math.floor((targetStart - sourceStart) / (1000 * 60 * 60 * 24));

  // Create new assignments for target week
  const newAssignments = sourceAssignments.map(assignment => {
    const newDate = new Date(assignment.date);
    newDate.setDate(newDate.getDate() + dayOffset);

    return {
      schedule: assignment.schedule,
      employee: assignment.employee,
      date: newDate,
      shiftTemplate: assignment.shiftTemplate?._id,
      type: assignment.type,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      notes: assignment.notes,
      color: assignment.color,
      breaks: assignment.breaks,
      createdBy: userId
    };
  });

  const created = await ShiftAssignment.insertMany(newAssignments);

  res.status(201).json({
    message: `Zduplikowano ${created.length} zmian`,
    count: created.length,
    assignments: created
  });
});

/**
 * Copy employee schedule to another employee
 * POST /api/schedule/copy-employee-schedule
 */
exports.copyEmployeeSchedule = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { scheduleId, sourceEmployeeId, targetEmployeeId, startDate, endDate } = req.body;

  if (!scheduleId || !sourceEmployeeId || !targetEmployeeId) {
    return res.status(400).json({ 
      message: 'ID grafiku, ID pracownika źródłowego i docelowego są wymagane' 
    });
  }

  if (sourceEmployeeId === targetEmployeeId) {
    return res.status(400).json({ 
      message: 'Pracownik źródłowy i docelowy nie mogą być tacy sami' 
    });
  }

  // Verify target employee exists
  const targetEmployee = await Employee.findById(targetEmployeeId);
  if (!targetEmployee) {
    return res.status(404).json({ message: 'Pracownik docelowy nie istnieje' });
  }

  // Build query
  const query = {
    schedule: scheduleId,
    employee: sourceEmployeeId
  };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Get source employee assignments
  const sourceAssignments = await ShiftAssignment.find(query)
    .populate('shiftTemplate');

  if (sourceAssignments.length === 0) {
    return res.status(404).json({ 
      message: 'Brak przypisań dla pracownika źródłowego' 
    });
  }

  // Create new assignments for target employee
  const newAssignments = sourceAssignments.map(assignment => ({
    schedule: assignment.schedule,
    employee: targetEmployeeId,
    date: assignment.date,
    shiftTemplate: assignment.shiftTemplate?._id,
    type: assignment.type,
    startTime: assignment.startTime,
    endTime: assignment.endTime,
    notes: assignment.notes,
    color: assignment.color,
    breaks: assignment.breaks,
    createdBy: userId
  }));

  const created = await ShiftAssignment.insertMany(newAssignments);

  res.status(201).json({
    message: `Skopiowano ${created.length} zmian do pracownika ${targetEmployee.firstName} ${targetEmployee.lastName}`,
    count: created.length,
    assignments: created
  });
});

/**
 * Bulk reassign shifts to different employee
 * POST /api/schedule/bulk-reassign
 */
exports.bulkReassignShifts = asyncHandler(async (req, res) => {
  const userId = req.userId || (req.user && req.user.id);
  const { assignmentIds, targetEmployeeId } = req.body;

  if (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return res.status(400).json({ 
      message: 'Tablica ID przypisań jest wymagana' 
    });
  }

  if (!targetEmployeeId) {
    return res.status(400).json({ 
      message: 'ID pracownika docelowego jest wymagane' 
    });
  }

  // Verify target employee exists
  const targetEmployee = await Employee.findById(targetEmployeeId);
  if (!targetEmployee) {
    return res.status(404).json({ message: 'Pracownik docelowy nie istnieje' });
  }

  // Update all assignments
  const result = await ShiftAssignment.updateMany(
    { _id: { $in: assignmentIds } },
    { 
      $set: { 
        employee: targetEmployeeId,
        updatedBy: userId
      } 
    }
  );

  res.json({
    message: `Przepisano ${result.modifiedCount} zmian do pracownika ${targetEmployee.firstName} ${targetEmployee.lastName}`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  });
});
