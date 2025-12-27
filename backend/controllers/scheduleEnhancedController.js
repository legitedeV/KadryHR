/**
 * Enhanced Schedule Controller
 * Uses service layer, validation, and multi-tenant middleware
 * Example of production-grade controller implementation
 */

const scheduleService = require('../services/scheduleService');
const Schedule = require('../models/Schedule');
const ShiftAssignment = require('../models/ShiftAssignment');

/**
 * Publish schedule
 * POST /api/schedules/:id/publish
 */
const publishSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { notifyEmployees = true } = req.body;

    // Use service layer
    const schedule = await scheduleService.publishSchedule(
      id,
      req.user._id,
      req.organizationId
    );

    // TODO: Send notifications to employees if notifyEmployees is true
    // This would integrate with notification service

    res.json({
      success: true,
      message: 'Schedule published successfully',
      data: schedule,
    });
  } catch (error) {
    console.error('Error publishing schedule:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to publish schedule',
    });
  }
};

/**
 * Check for conflicts
 * POST /api/schedules/check-conflicts
 */
const checkConflicts = async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, excludeAssignmentId } = req.validatedData;

    const conflicts = await scheduleService.checkConflicts(
      employeeId,
      date,
      startTime,
      endTime,
      excludeAssignmentId,
      req.organizationId
    );

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check conflicts',
    });
  }
};

/**
 * Copy week
 * POST /api/schedules/bulk/copy-week
 */
const copyWeek = async (req, res) => {
  try {
    const { scheduleId, sourceWeekStart, targetWeekStart, employeeIds } = req.validatedData;

    const result = await scheduleService.copyWeek(
      scheduleId,
      sourceWeekStart,
      targetWeekStart,
      employeeIds,
      req.organizationId
    );

    res.json({
      success: true,
      message: `Successfully copied ${result.created} shifts`,
      data: result,
    });
  } catch (error) {
    console.error('Error copying week:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to copy week',
    });
  }
};

/**
 * Apply template to multiple days/employees
 * POST /api/schedules/bulk/apply-template
 */
const applyTemplate = async (req, res) => {
  try {
    const { scheduleId, templateId, dates, employeeIds } = req.validatedData;

    const result = await scheduleService.applyTemplate(
      scheduleId,
      templateId,
      dates,
      employeeIds,
      req.organizationId
    );

    res.json({
      success: true,
      message: `Successfully applied template to ${result.created} shifts`,
      data: result,
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to apply template',
    });
  }
};

/**
 * Delete shifts in range
 * POST /api/schedules/bulk/delete-range
 */
const deleteRange = async (req, res) => {
  try {
    const { scheduleId, startDate, endDate, employeeIds } = req.validatedData;

    const result = await scheduleService.deleteRange(
      scheduleId,
      startDate,
      endDate,
      employeeIds,
      req.organizationId
    );

    res.json({
      success: true,
      message: `Successfully deleted ${result.deleted} shifts`,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting shifts:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete shifts',
    });
  }
};

/**
 * Get schedule statistics
 * GET /api/schedules/:id/stats
 */
const getScheduleStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify schedule belongs to organization
    const schedule = await Schedule.findOne({
      _id: id,
      ...req.filterByOrganization(),
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    const stats = await scheduleService.getScheduleStats(id, req.organizationId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting schedule stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule statistics',
    });
  }
};

/**
 * Get time comparison (planned vs actual)
 * GET /api/schedules/:id/time-comparison
 */
const getTimeComparison = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify schedule belongs to organization
    const schedule = await Schedule.findOne({
      _id: id,
      ...req.filterByOrganization(),
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Get all shifts in date range
    const query = {
      schedule: id,
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const shifts = await ShiftAssignment.find(query)
      .populate('employee', 'firstName lastName')
      .sort({ date: 1, employee: 1 });

    // TODO: Integrate with TimeEntry model to get actual hours
    // For now, return planned hours only
    const comparison = shifts.map((shift) => ({
      date: shift.date,
      employee: shift.employee,
      planned: {
        startTime: shift.startTime,
        endTime: shift.endTime,
        hours: shift.durationHours,
      },
      actual: null, // TODO: Get from TimeEntry
      difference: null,
    }));

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error getting time comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get time comparison',
    });
  }
};

module.exports = {
  publishSchedule,
  checkConflicts,
  copyWeek,
  applyTemplate,
  deleteRange,
  getScheduleStats,
  getTimeComparison,
};
