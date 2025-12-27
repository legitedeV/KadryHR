/**
 * Unit tests for scheduleService
 * Example of how to test service layer
 * 
 * To run: npm test
 * 
 * TODO: Install Jest and set up test environment
 * npm install -D jest @types/jest
 */

const scheduleService = require('../scheduleService');
const ShiftAssignment = require('../../models/ShiftAssignment');
const Leave = require('../../models/Leave');
const Schedule = require('../../models/Schedule');

// Mock Mongoose models
jest.mock('../../models/ShiftAssignment');
jest.mock('../../models/Leave');
jest.mock('../../models/Schedule');

describe('scheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkConflicts', () => {
    it('should detect overlapping shifts', async () => {
      const employeeId = '507f1f77bcf86cd799439011';
      const date = '2025-12-28';
      const startTime = '09:00';
      const endTime = '17:00';

      // Mock existing shift that overlaps
      ShiftAssignment.find.mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439012',
          employee: employeeId,
          date: new Date(date),
          type: 'shift',
          startTime: '08:00',
          endTime: '16:00',
        },
      ]);

      Leave.find.mockResolvedValue([]);

      const conflicts = await scheduleService.checkConflicts(
        employeeId,
        date,
        startTime,
        endTime,
        null,
        'org123'
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('overlapping_shift');
      expect(conflicts[0].severity).toBe('error');
    });

    it('should detect leave conflicts', async () => {
      const employeeId = '507f1f77bcf86cd799439011';
      const date = '2025-12-28';
      const startTime = '09:00';
      const endTime = '17:00';

      ShiftAssignment.find.mockResolvedValue([]);

      // Mock approved leave on the same day
      Leave.find.mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439013',
          employee: employeeId,
          status: 'approved',
          startDate: new Date('2025-12-27'),
          endDate: new Date('2025-12-29'),
        },
      ]);

      const conflicts = await scheduleService.checkConflicts(
        employeeId,
        date,
        startTime,
        endTime,
        null,
        'org123'
      );

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('leave_conflict');
      expect(conflicts[0].severity).toBe('error');
    });

    it('should return no conflicts when times do not overlap', async () => {
      const employeeId = '507f1f77bcf86cd799439011';
      const date = '2025-12-28';
      const startTime = '09:00';
      const endTime = '17:00';

      // Mock existing shift that does NOT overlap
      ShiftAssignment.find.mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439012',
          employee: employeeId,
          date: new Date(date),
          type: 'shift',
          startTime: '06:00',
          endTime: '08:00', // Ends before new shift starts
        },
      ]);

      Leave.find.mockResolvedValue([]);

      const conflicts = await scheduleService.checkConflicts(
        employeeId,
        date,
        startTime,
        endTime,
        null,
        'org123'
      );

      expect(conflicts).toHaveLength(0);
    });

    it('should handle overnight shifts correctly', async () => {
      const employeeId = '507f1f77bcf86cd799439011';
      const date = '2025-12-28';
      const startTime = '22:00';
      const endTime = '06:00'; // Next day

      ShiftAssignment.find.mockResolvedValue([]);
      Leave.find.mockResolvedValue([]);

      const conflicts = await scheduleService.checkConflicts(
        employeeId,
        date,
        startTime,
        endTime,
        null,
        'org123'
      );

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('publishSchedule', () => {
    it('should publish draft schedule', async () => {
      const scheduleId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';
      const orgId = 'org123';

      const mockSchedule = {
        _id: scheduleId,
        status: 'draft',
        save: jest.fn().mockResolvedValue(true),
      };

      Schedule.findOne.mockResolvedValue(mockSchedule);

      await scheduleService.publishSchedule(scheduleId, userId, orgId);

      expect(mockSchedule.status).toBe('published');
      expect(mockSchedule.publishedBy).toBe(userId);
      expect(mockSchedule.publishedAt).toBeInstanceOf(Date);
      expect(mockSchedule.save).toHaveBeenCalled();
    });

    it('should throw error if schedule not found', async () => {
      Schedule.findOne.mockResolvedValue(null);

      await expect(
        scheduleService.publishSchedule('invalid-id', 'user123', 'org123')
      ).rejects.toThrow('Schedule not found');
    });

    it('should throw error if schedule already published', async () => {
      const mockSchedule = {
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
      };

      Schedule.findOne.mockResolvedValue(mockSchedule);

      await expect(
        scheduleService.publishSchedule('507f1f77bcf86cd799439011', 'user123', 'org123')
      ).rejects.toThrow('Schedule is already published');
    });
  });

  describe('copyWeek', () => {
    it('should copy shifts from source week to target week', async () => {
      const scheduleId = '507f1f77bcf86cd799439011';
      const sourceWeekStart = '2025-12-23';
      const targetWeekStart = '2025-12-30';
      const employeeIds = ['507f1f77bcf86cd799439012'];
      const orgId = 'org123';

      const mockShifts = [
        {
          schedule: scheduleId,
          employee: employeeIds[0],
          date: new Date('2025-12-23'),
          type: 'shift',
          startTime: '09:00',
          endTime: '17:00',
          shiftTemplate: '507f1f77bcf86cd799439013',
          notes: 'Test shift',
          color: '#3b82f6',
          breaks: [],
          createdBy: 'user123',
        },
      ];

      ShiftAssignment.find.mockResolvedValue(mockShifts);
      ShiftAssignment.insertMany.mockResolvedValue([]);

      const result = await scheduleService.copyWeek(
        scheduleId,
        sourceWeekStart,
        targetWeekStart,
        employeeIds,
        orgId
      );

      expect(result.created).toBe(1);
      expect(ShiftAssignment.insertMany).toHaveBeenCalled();
    });
  });

  describe('getScheduleStats', () => {
    it('should calculate schedule statistics', async () => {
      const scheduleId = '507f1f77bcf86cd799439011';
      const orgId = 'org123';

      const mockShifts = [
        {
          employee: '507f1f77bcf86cd799439012',
          durationHours: 8,
          status: 'scheduled',
          type: 'shift',
        },
        {
          employee: '507f1f77bcf86cd799439012',
          durationHours: 8,
          status: 'scheduled',
          type: 'shift',
        },
        {
          employee: '507f1f77bcf86cd799439013',
          durationHours: 8,
          status: 'confirmed',
          type: 'shift',
        },
      ];

      ShiftAssignment.find.mockResolvedValue(mockShifts);

      const stats = await scheduleService.getScheduleStats(scheduleId, orgId);

      expect(stats.totalShifts).toBe(3);
      expect(stats.totalHours).toBe(24);
      expect(stats.employeeCount).toBe(2);
      expect(stats.statusBreakdown.scheduled).toBe(2);
      expect(stats.statusBreakdown.confirmed).toBe(1);
      expect(stats.typeBreakdown.shift).toBe(3);
    });
  });
});
