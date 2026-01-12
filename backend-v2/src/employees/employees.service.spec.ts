import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { AuditService } from '../audit/audit.service';

const baseEmployee = {
  id: 'emp-1',
  organisationId: 'org-1',
  userId: null,
  firstName: 'Anna',
  lastName: 'Nowak',
  email: 'anna@example.com',
  phone: null,
  position: 'Kierownik',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
};

const baseLocation = {
  id: 'loc-1',
  organisationId: 'org-1',
  name: 'Sklep 1',
  address: 'Testowa 1',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
};

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      employee: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      location: {
        findMany: jest.fn(),
      },
      locationAssignment: {
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((operations: any) => {
        if (typeof operations === 'function') {
          return operations(prisma);
        }
        if (Array.isArray(operations)) {
          return Promise.all(operations);
        }
        return operations;
      }),
    } as unknown as jest.Mocked<PrismaService>;

    auditService = {
      record: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    service = new EmployeesService(prisma, auditService);
  });

  it('returns paginated employees scoped to organisation with search', async () => {
    prisma.employee.findMany.mockResolvedValue([
      {
        ...baseEmployee,
        locations: [{ location: baseLocation }],
      } as any,
    ]);
    prisma.employee.count.mockResolvedValue(1);

    const query: QueryEmployeesDto = { search: 'Anna', skip: 0, take: 10 };

    const result = await service.findAll('org-1', query);

    const findManyArgs = prisma.employee.findMany.mock.calls[0]?.[0];

    expect(findManyArgs).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({ organisationId: 'org-1' }),
        skip: 0,
        take: 10,
      }),
    );
    expect(result.total).toBe(1);
    expect(result.data[0].firstName).toBe('Anna');
    expect(result.data[0].locations[0].name).toBe('Sklep 1');
  });

  it('throws when updating employee outside organisation', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);

    await expect(
      service.update('org-1', 'emp-missing', { firstName: 'John' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns existing employee profile for user', async () => {
    prisma.employee.findFirst.mockResolvedValue(baseEmployee as any);

    const result = await service.ensureEmployeeProfile('org-1', 'user-1');

    expect(result).toEqual(baseEmployee);
    expect(prisma.employee.create).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('creates employee profile for user when missing', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Eva',
      lastName: 'Nowak',
    } as any);
    prisma.employee.create.mockResolvedValue({
      ...baseEmployee,
      id: 'emp-new',
      userId: 'user-1',
      firstName: 'Eva',
      lastName: 'Nowak',
      email: 'user@example.com',
    } as any);

    const result = await service.ensureEmployeeProfile('org-1', 'user-1');

    expect(result.id).toBe('emp-new');
    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organisationId: 'org-1',
          userId: 'user-1',
          firstName: 'Eva',
          lastName: 'Nowak',
          email: 'user@example.com',
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organisationId: 'org-1',
        actorUserId: 'user-1',
        action: 'employee.profile.created',
      }),
    );
  });

  it('requires user profile names before creating employee profile', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
    } as any);

    await expect(
      service.ensureEmployeeProfile('org-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
