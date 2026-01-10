import { Test, TestingModule } from '@nestjs/testing';
import { LeaveBalanceService } from './leave-balance.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, LeaveCategory } from '@prisma/client';

const mockPrisma = {
  leaveBalance: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
  },
  leaveType: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  leaveRequest: {
    findFirst: jest.fn(),
  },
};

describe('LeaveBalanceService', () => {
  let service: LeaveBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveBalanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(LeaveBalanceService);
    jest.clearAllMocks();
  });

  describe('getEmployeeBalances', () => {
    it('should return balances for an employee', async () => {
      const year = 2024;
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop wypoczynkowy', defaultDaysPerYear: 26, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue(null);
      mockPrisma.leaveBalance.create.mockResolvedValue({
        id: 'lb-1',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-1',
        year,
        allocated: 26,
        used: 0,
        adjustment: 0,
      });
      mockPrisma.leaveBalance.findMany.mockResolvedValue([
        {
          id: 'lb-1',
          employeeId: 'emp-1',
          leaveTypeId: 'lt-1',
          year,
          allocated: 26,
          used: 5,
          adjustment: 0,
          employee: { firstName: 'Jan', lastName: 'Kowalski' },
          leaveType: { name: 'Urlop wypoczynkowy' },
        },
      ]);

      const result = await service.getEmployeeBalances('org-1', 'emp-1', year);

      expect(result).toHaveLength(1);
      expect(result[0].allocated).toBe(26);
      expect(result[0].used).toBe(5);
      expect(result[0].remaining).toBe(21);
      expect(result[0].employeeName).toBe('Jan Kowalski');
    });
  });

  describe('validateBalance', () => {
    it('should return valid when balance is sufficient', async () => {
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop', defaultDaysPerYear: 26, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue({
        id: 'lb-1',
        allocated: 26,
        used: 0,
        adjustment: 0,
      });

      const result = await service.validateBalance(
        'org-1',
        'emp-1',
        'lt-1',
        new Date('2024-01-08'),
        new Date('2024-01-12'), // 5 working days (Mon-Fri)
      );

      expect(result.valid).toBe(true);
    });

    it('should return invalid when balance is insufficient', async () => {
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop', defaultDaysPerYear: 26, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue({
        id: 'lb-1',
        allocated: 5,
        used: 4,
        adjustment: 0,
      });

      const result = await service.validateBalance(
        'org-1',
        'emp-1',
        'lt-1',
        new Date('2024-01-08'),
        new Date('2024-01-12'), // 5 working days (Mon-Fri)
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('Niewystarczająca liczba dni urlopu');
      expect(result.remaining).toBe(1);
    });

    it('should skip validation when no leave type is specified', async () => {
      const result = await service.validateBalance(
        'org-1',
        'emp-1',
        null,
        new Date('2024-01-08'),
        new Date('2024-01-12'),
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('calculateWorkingDays', () => {
    it('should count only weekdays', async () => {
      // Testing indirectly through validateBalance
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop', defaultDaysPerYear: 100, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue({
        id: 'lb-1',
        allocated: 100,
        used: 0,
        adjustment: 0,
      });

      // Monday to Sunday = 5 working days (excludes Sat+Sun)
      const result = await service.validateBalance(
        'org-1',
        'emp-1',
        'lt-1',
        new Date('2024-01-08'), // Monday
        new Date('2024-01-14'), // Sunday
      );

      expect(result.valid).toBe(true);
      expect(result.remaining).toBe(95); // 100 - 5 = 95
    });
  });

  describe('updateUsedBalance', () => {
    it('should add days when approved', async () => {
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop', defaultDaysPerYear: 26, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue({
        id: 'lb-1',
        allocated: 26,
        used: 0,
        adjustment: 0,
      });
      mockPrisma.leaveBalance.update.mockResolvedValue({
        id: 'lb-1',
        used: 5,
      });

      await service.updateUsedBalance(
        'org-1',
        'emp-1',
        'lt-1',
        new Date('2024-01-08'),
        new Date('2024-01-12'),
        'add',
      );

      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ used: 5 }),
        }),
      );
    });

    it('should subtract days when cancelled', async () => {
      mockPrisma.leaveType.findMany.mockResolvedValue([
        { id: 'lt-1', name: 'Urlop', defaultDaysPerYear: 26, isActive: true },
      ]);
      mockPrisma.leaveBalance.findFirst.mockResolvedValue({
        id: 'lb-1',
        allocated: 26,
        used: 5,
        adjustment: 0,
      });
      mockPrisma.leaveBalance.update.mockResolvedValue({
        id: 'lb-1',
        used: 0,
      });

      await service.updateUsedBalance(
        'org-1',
        'emp-1',
        'lt-1',
        new Date('2024-01-08'),
        new Date('2024-01-12'),
        'subtract',
      );

      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ used: 0 }),
        }),
      );
    });
  });
});
