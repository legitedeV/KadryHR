import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AvailabilitySubmissionStatus, Role } from '@prisma/client';

const mockPrisma = {
  availability: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  availabilityWindow: {
    findFirst: jest.fn(),
  },
  availabilitySubmission: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  employee: {
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
};

const mockEmployeesService = {
  ensureEmployeeProfile: jest.fn(),
};

const mockAuditService = {
  record: jest.fn(),
};

const mockNotificationsService = {
  createNotification: jest.fn(),
};

const mockEmployeesService = {
  ensureEmployeeProfile: jest.fn(),
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmployeesService, useValue: mockEmployeesService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);

    jest.clearAllMocks();
  });

  it('creates availability with valid range', async () => {
    mockPrisma.availability.create.mockResolvedValue({ id: '1' });

    const result = await service.create('org', {
      employeeId: 'emp',
      weekday: 'MONDAY' as any,
      startMinutes: 60,
      endMinutes: 120,
    });

    expect(result).toEqual({ id: '1' });
    expect(mockPrisma.availability.create).toHaveBeenCalled();
  });

  it('throws on invalid range', async () => {
    await expect(
      service.create('org', {
        employeeId: 'emp',
        weekday: 'MONDAY' as any,
        startMinutes: 120,
        endMinutes: 60,
      }),
    ).rejects.toThrow();
  });

  it('saves availability submission for open window', async () => {
    const window = {
      id: 'window-1',
      organisationId: 'org',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-04-30'),
      deadline: new Date('2099-04-01'),
      isOpen: true,
      title: 'Kwiecień',
    };

    mockPrisma.availabilityWindow.findFirst.mockResolvedValue(window);
    mockEmployeesService.ensureEmployeeProfile.mockResolvedValue({
      id: 'emp-1',
      firstName: 'Anna',
      lastName: 'Nowak',
    });
    mockPrisma.availabilitySubmission.findUnique.mockResolvedValue(null);
    mockPrisma.availability.create.mockResolvedValue({ id: 'avail-1' });
    mockPrisma.availabilitySubmission.upsert.mockResolvedValue({
      id: 'sub-1',
      status: AvailabilitySubmissionStatus.SUBMITTED,
      submittedAt: new Date('2024-03-01'),
    });
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'manager-1', role: Role.MANAGER },
    ]);

    const result = await service.saveWindowAvailabilityForEmployee(
      'org',
      'user-1',
      'window-1',
      [
        {
          date: '2024-04-03',
          startMinutes: 480,
          endMinutes: 960,
        },
      ],
      true,
    );

    expect(result.status).toBe(AvailabilitySubmissionStatus.SUBMITTED);
    expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    expect(mockAuditService.record).toHaveBeenCalled();
  });
});
