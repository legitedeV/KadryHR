const Schedule = require('../models/Schedule');
const ShiftAssignment = require('../models/ShiftAssignment');
const ShiftTemplate = require('../models/ShiftTemplate');
const Leave = require('../models/Leave');

class ScheduleService {
  /**
   * Check for shift conflicts (overlapping shifts, leave conflicts)
   */
  async checkConflicts(employeeId, date, startTime, endTime, excludeAssignmentId = null, _organizationId) {
    const conflicts = [];

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight shifts
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    // Check for overlapping shifts
    const query = {
      employee: employeeId,
      date: new Date(date),
      type: 'shift',
    };

    if (excludeAssignmentId) {
      query._id = { $ne: excludeAssignmentId };
    }

    const existingShifts = await ShiftAssignment.find(query);

    for (const shift of existingShifts) {
      if (!shift.startTime || !shift.endTime) continue;

      const [shiftStartHour, shiftStartMin] = shift.startTime.split(':').map(Number);
      const [shiftEndHour, shiftEndMin] = shift.endTime.split(':').map(Number);
      const shiftStartMinutes = shiftStartHour * 60 + shiftStartMin;
      let shiftEndMinutes = shiftEndHour * 60 + shiftEndMin;

      if (shiftEndMinutes < shiftStartMinutes) {
        shiftEndMinutes += 24 * 60;
      }

      // Check for overlap
      if (
        (startMinutes >= shiftStartMinutes && startMinutes < shiftEndMinutes) ||
        (endMinutes > shiftStartMinutes && endMinutes <= shiftEndMinutes) ||
        (startMinutes <= shiftStartMinutes && endMinutes >= shiftEndMinutes)
      ) {
        conflicts.push({
          type: 'overlapping_shift',
          message: `Nakładająca się zmiana: ${shift.startTime} - ${shift.endTime}`,
          severity: 'error',
          shiftId: shift._id,
        });
      }
    }

    // Check for approved leaves
    const leaveQuery = {
      employee: employeeId,
      status: 'approved',
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) },
    };

    const leaves = await Leave.find(leaveQuery);

    if (leaves.length > 0) {
      conflicts.push({
        type: 'leave_conflict',
        message: `Pracownik ma zatwierdzony urlop w tym dniu`,
        severity: 'error',
        leaveId: leaves[0]._id,
      });
    }

    return conflicts;
  }

  /**
   * Publish schedule (change status from draft to published)
   */
  async publishSchedule(scheduleId, userId, _organizationId) {
    const schedule = await Schedule.findOne({ _id: scheduleId });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status === 'published') {
      throw new Error('Schedule is already published');
    }

    schedule.status = 'published';
    schedule.publishedAt = new Date();
    schedule.publishedBy = userId;

    await schedule.save();

    return schedule;
  }

  /**
   * Copy week of shifts to another week
   */
  async copyWeek(scheduleId, sourceWeekStart, targetWeekStart, employeeIds, _organizationId) {
    const sourceDate = new Date(sourceWeekStart);
    const targetDate = new Date(targetWeekStart);

    // Get all shifts from source week
    const query = {
      schedule: scheduleId,
      date: {
        $gte: sourceDate,
        $lt: new Date(sourceDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    };

    if (employeeIds && employeeIds.length > 0) {
      query.employee = { $in: employeeIds };
    }

    const sourceShifts = await ShiftAssignment.find(query);

    // Create new shifts for target week
    const newShifts = [];
    for (const shift of sourceShifts) {
      const dayOffset = Math.floor(
        (shift.date.getTime() - sourceDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const newDate = new Date(targetDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      const newShift = new ShiftAssignment({
        schedule: shift.schedule,
        employee: shift.employee,
        date: newDate,
        type: shift.type,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftTemplate: shift.shiftTemplate,
        notes: shift.notes,
        color: shift.color,
        breaks: shift.breaks,
        createdBy: shift.createdBy,
      });

      newShifts.push(newShift);
    }

    await ShiftAssignment.insertMany(newShifts);

    return { created: newShifts.length };
  }

  /**
   * Apply template to multiple days/employees
   */
  async applyTemplate(scheduleId, templateId, dates, employeeIds, _organizationId) {
    const template = await ShiftTemplate.findOne({ _id: templateId });

    if (!template) {
      throw new Error('Template not found');
    }

    const newShifts = [];

    for (const date of dates) {
      for (const employeeId of employeeIds) {
        // Check if shift already exists
        const existing = await ShiftAssignment.findOne({
          schedule: scheduleId,
          employee: employeeId,
          date: new Date(date),
        });

        if (existing) {
          // Update existing
          existing.startTime = template.startTime;
          existing.endTime = template.endTime;
          existing.shiftTemplate = template._id;
          existing.color = template.color;
          existing.breaks = template.breaks;
          await existing.save();
        } else {
          // Create new
          const newShift = new ShiftAssignment({
            schedule: scheduleId,
            employee: employeeId,
            date: new Date(date),
            type: 'shift',
            startTime: template.startTime,
            endTime: template.endTime,
            shiftTemplate: template._id,
            color: template.color,
            breaks: template.breaks,
          });
          newShifts.push(newShift);
        }
      }
    }

    if (newShifts.length > 0) {
      await ShiftAssignment.insertMany(newShifts);
    }

    return { created: newShifts.length };
  }

  /**
   * Delete shifts in date range
   */
  async deleteRange(scheduleId, startDate, endDate, employeeIds, _organizationId) {
    const query = {
      schedule: scheduleId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (employeeIds && employeeIds.length > 0) {
      query.employee = { $in: employeeIds };
    }

    const result = await ShiftAssignment.deleteMany(query);

    return { deleted: result.deletedCount };
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(scheduleId, _organizationId) {
    const shifts = await ShiftAssignment.find({ schedule: scheduleId });

    const stats = {
      totalShifts: shifts.length,
      totalHours: 0,
      employeeCount: new Set(shifts.map((s) => s.employee.toString())).size,
      statusBreakdown: {},
      typeBreakdown: {},
    };

    for (const shift of shifts) {
      // Calculate hours
      if (shift.durationHours) {
        stats.totalHours += shift.durationHours;
      }

      // Status breakdown
      stats.statusBreakdown[shift.status] = (stats.statusBreakdown[shift.status] || 0) + 1;

      // Type breakdown
      stats.typeBreakdown[shift.type] = (stats.typeBreakdown[shift.type] || 0) + 1;
    }

    return stats;
  }
}

module.exports = new ScheduleService();
