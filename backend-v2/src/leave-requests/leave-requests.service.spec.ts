import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveBalanceService } from './leave-balance.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, LeaveCategory, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

const mockPrisma = {
  leaveRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  employee: {
    findFirst: jest.fn(),
  },
  leaveType: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockNotifications = {
  createNotification: jest.fn(),
};

const mockAudit = {
  log: jest.fn(),
};

const mockLeaveBalanceService = {
  validateBalance: jest.fn(),
  updateUsedBalance: jest.fn(),
  getEmployeeBalances: jest.fn(),
  getOrganisationBalances: jest.fn(),
  adjustBalance: jest.fn(),
};

describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AuditService, useValue: mockAudit },
        { provide: LeaveBalanceService, useValue: mockLeaveBalanceService },
      ],
    }).compile();

    service = module.get(LeaveRequestsService);
    jest.clearAllMocks();
    mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
    mockNotifications.createNotification.mockResolvedValue(null);
    mockPrisma.leaveRequest.findMany.mockResolvedValue([]);
    mockPrisma.leaveRequest.count.mockResolvedValue(0);
    mockPrisma.$transaction.mockImplementation(async (operations) =>
      Promise.all(operations),
    );
    mockPrisma.leaveRequest.create.mockResolvedValue({
      id: 'lr-new',
      organisationId: 'org-1',
      employeeId: 'emp-1',
    });
    mockPrisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'lr-1',
      organisationId: 'org-1',
      status: LeaveStatus.PENDING,
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2024-01-02T00:00:00.000Z'),
      type: LeaveCategory.PAID_LEAVE,
    });
    mockLeaveBalanceService.validateBalance.mockResolvedValue({ valid: true });
    mockLeaveBalanceService.updateUsedBalance.mockResolvedValue(undefined);
  });

  it('rejects leave when startDate is after endDate', async () => {
    await expect(
      service.create(
        'org-1',
        {
          employeeId: 'emp-1',
          type: LeaveCategory.PAID_LEAVE,
          startDate: '2024-02-02T00:00:00.000Z',
          endDate: '2024-02-01T00:00:00.000Z',
        },
        { userId: 'user-1', role: Role.MANAGER },
      ),
    ).rejects.toThrow('startDate must be before or equal to endDate');
  });

  it('enforces employee scope for self-service users', async () => {
    mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp-self' });

    await service.create(
      'org-1',
      {
        employeeId: 'emp-self',
        type: LeaveCategory.SICK,
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-02-02T00:00:00.000Z',
      },
      { userId: 'user-1', role: Role.EMPLOYEE },
    );

    expect(mockPrisma.leaveRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ employeeId: 'emp-self' }),
      }),
    );
  });

  it('sets approval metadata when status changes', async () => {
    mockPrisma.leaveRequest.update.mockResolvedValue({
      id: 'lr-1',
      status: LeaveStatus.APPROVED,
      employee: { userId: 'user-emp' },
    });

    await service.updateStatus(
      'org-1',
      'lr-1',
      { status: LeaveStatus.APPROVED },
      'approver-1',
    );

    expect(mockPrisma.leaveRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: LeaveStatus.APPROVED,
          approvedByUserId: 'approver-1',
        }),
      }),
    );
    expect(mockNotifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        userId: 'user-emp',
        type: expect.any(String),
      }),
    );
  });

  it('applies default pagination when skip/take are missing', async () => {
    const result = await service.findAll('org-1', {} as any);

    expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(result).toEqual({ data: [], total: 0, skip: 0, take: 20 });
  });

  it('accepts explicit take/skip values', async () => {
    await service.findAll('org-1', { take: 5, skip: 10 } as any);

    expect(mockPrisma.leaveRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });
});
