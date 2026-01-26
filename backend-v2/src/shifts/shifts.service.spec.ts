import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsService } from './shifts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../auth/permissions.service';
import { Permission } from '../auth/permissions';

const mockPrisma = {
  shift: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  employee: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
  },
  availability: {
    findMany: jest.fn(),
  },
  organisation: {
    findUnique: jest.fn(),
  },
  leaveRequest: {
    findFirst: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockNotifications = {
  createNotification: jest.fn(),
};

const mockPermissions = {
  getOrganisationPermissions: jest.fn(),
};

describe('ShiftsService', () => {
  let service: ShiftsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: PermissionsService, useValue: mockPermissions },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    jest.clearAllMocks();
    mockNotifications.createNotification.mockResolvedValue(null);
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      isActive: true,
      isDeleted: false,
    });
    mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1' });
    mockPrisma.shift.findFirst.mockResolvedValue(null);
    mockPrisma.availability.findMany.mockResolvedValue([]);
    mockPrisma.organisation.findUnique.mockResolvedValue({
      preventShiftOnApprovedLeave: false,
    });
    mockPrisma.leaveRequest.findFirst.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue({ role: 'MANAGER' });
    mockPermissions.getOrganisationPermissions.mockResolvedValue([
      Permission.SCHEDULE_MANAGE,
    ]);
  });

  it('throws on overlapping shift for employee', async () => {
    mockPrisma.shift.findFirst.mockResolvedValue({ id: 'conflict' });

    await expect(
      service.create('org-1', {
        employeeId: 'emp-1',
        startsAt: '2024-01-01T08:00:00.000Z',
        endsAt: '2024-01-01T12:00:00.000Z',
      }),
    ).rejects.toThrow('Employee already has a shift in this time range');
  });

  it('does not warn when default availability is implied', async () => {
    mockPrisma.shift.findFirst.mockResolvedValueOnce(null); // ensureEmployee
    mockPrisma.shift.findFirst.mockResolvedValueOnce(null); // conflict
    mockPrisma.availability.findMany.mockResolvedValue([]);
    mockPrisma.shift.create.mockResolvedValue({
      id: 'shift-1',
      employeeId: 'emp-1',
      startsAt: new Date('2024-01-01T08:00:00.000Z'),
      endsAt: new Date('2024-01-01T12:00:00.000Z'),
    });

    const result = await service.create('org-1', {
      employeeId: 'emp-1',
      startsAt: '2024-01-01T08:00:00.000Z',
      endsAt: '2024-01-01T12:00:00.000Z',
    });

    expect(result.availabilityWarning).toBeNull();
  });

  it('calculates summary hours', async () => {
    mockPrisma.shift.findMany.mockResolvedValue([
      {
        employeeId: 'emp-1',
        startsAt: new Date('2024-01-01T08:00:00.000Z'),
        endsAt: new Date('2024-01-01T12:00:00.000Z'),
      },
      {
        employeeId: 'emp-1',
        startsAt: new Date('2024-01-02T08:00:00.000Z'),
        endsAt: new Date('2024-01-02T10:00:00.000Z'),
      },
    ]);
    mockPrisma.employee.findMany.mockResolvedValue([
      { id: 'emp-1', firstName: 'Jan', lastName: 'Kowalski', email: null },
    ]);

    const summary = await service.summary('org-1', {
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-01-07T00:00:00.000Z',
    } as any);

    expect(summary).toEqual([
      { employeeId: 'emp-1', employeeName: 'Jan Kowalski', hours: 6 },
    ]);
  });

  it('clears shifts for a week with optional location', async () => {
    mockPrisma.shift.deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.clearWeek(
      'org-1',
      {
        from: new Date('2024-01-01T00:00:00.000Z'),
        to: new Date('2024-01-07T23:59:59.000Z'),
      },
      'loc-1',
    );

    expect(mockPrisma.shift.deleteMany).toHaveBeenCalledWith({
      where: {
        organisationId: 'org-1',
        startsAt: { gte: new Date('2024-01-01T00:00:00.000Z') },
        endsAt: { lte: new Date('2024-01-07T23:59:59.000Z') },
        locationId: 'loc-1',
      },
    });
    expect(result).toEqual({ deletedCount: 3 });
  });

  describe('leave conflict handling', () => {
    it('blocks shift creation when preventShiftOnApprovedLeave is true', async () => {
      mockPrisma.organisation.findUnique.mockResolvedValue({
        preventShiftOnApprovedLeave: true,
      });
      mockPrisma.leaveRequest.findFirst.mockResolvedValue({
        id: 'leave-1',
        employeeId: 'emp-1',
        status: 'APPROVED',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        leaveType: { name: 'Urlop wypoczynkowy' },
      });

      await expect(
        service.create('org-1', {
          employeeId: 'emp-1',
          startsAt: '2024-01-01T08:00:00.000Z',
          endsAt: '2024-01-01T16:00:00.000Z',
        }),
      ).rejects.toThrow('ma zatwierdzony urlop');
    });

    it('allows shift with warning when preventShiftOnApprovedLeave is false', async () => {
      mockPrisma.organisation.findUnique.mockResolvedValue({
        preventShiftOnApprovedLeave: false,
      });
      mockPrisma.leaveRequest.findFirst.mockResolvedValue({
        id: 'leave-1',
        employeeId: 'emp-1',
        status: 'APPROVED',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        leaveType: { name: 'Urlop wypoczynkowy' },
      });
      mockPrisma.shift.create.mockResolvedValue({
        id: 'shift-1',
        employeeId: 'emp-1',
        startsAt: new Date('2024-01-01T08:00:00.000Z'),
        endsAt: new Date('2024-01-01T16:00:00.000Z'),
      });

      const result = await service.create('org-1', {
        employeeId: 'emp-1',
        startsAt: '2024-01-01T08:00:00.000Z',
        endsAt: '2024-01-01T16:00:00.000Z',
      });

      expect(result.leaveWarning).toContain('ma zatwierdzony urlop');
    });

    it('creates shift without warning when no leave conflict exists', async () => {
      mockPrisma.organisation.findUnique.mockResolvedValue({
        preventShiftOnApprovedLeave: true,
      });
      mockPrisma.leaveRequest.findFirst.mockResolvedValue(null);
      mockPrisma.shift.create.mockResolvedValue({
        id: 'shift-1',
        employeeId: 'emp-1',
        startsAt: new Date('2024-01-01T08:00:00.000Z'),
        endsAt: new Date('2024-01-01T16:00:00.000Z'),
      });

      const result = await service.create('org-1', {
        employeeId: 'emp-1',
        startsAt: '2024-01-01T08:00:00.000Z',
        endsAt: '2024-01-01T16:00:00.000Z',
      });

      expect(result.leaveWarning).toBeNull();
    });
  });
});
