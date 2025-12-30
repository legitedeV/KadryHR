import { Test, TestingModule } from '@nestjs/testing';
import { ShiftsService } from './shifts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  shift: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ShiftsService', () => {
  let service: ShiftsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ShiftsService>(ShiftsService);
    jest.clearAllMocks();
  });

  it('creates shift when times are chronological', async () => {
    mockPrisma.shift.create.mockResolvedValue({ id: 'shift-1' });

    const startsAt = '2024-01-01T08:00:00.000Z';
    const endsAt = '2024-01-01T16:00:00.000Z';

    const result = await service.create('org-1', {
      employeeId: 'emp-1',
      startsAt,
      endsAt,
    });

    expect(result).toEqual({ id: 'shift-1' });
    expect(mockPrisma.shift.create).toHaveBeenCalledWith({
      data: {
        organisationId: 'org-1',
        employeeId: 'emp-1',
        locationId: undefined,
        position: undefined,
        notes: undefined,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
    });
  });

  it('throws when startsAt is not before endsAt', () => {
    expect(() =>
      service.create('org-1', {
        employeeId: 'emp-1',
        startsAt: '2024-01-01T18:00:00.000Z',
        endsAt: '2024-01-01T16:00:00.000Z',
      }),
    ).toThrow('startsAt must be before endsAt');
  });

  it('validates chronology on update when both dates provided', async () => {
    mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift-1' });

    await expect(
      service.update('org-1', 'shift-1', {
        startsAt: '2024-01-01T18:00:00.000Z',
        endsAt: '2024-01-01T16:00:00.000Z',
      }),
    ).rejects.toThrow('startsAt must be before endsAt');
  });

  it('validates chronology when only one bound changes on update', async () => {
    mockPrisma.shift.findFirst.mockResolvedValue({
      id: 'shift-1',
      startsAt: new Date('2024-01-01T08:00:00.000Z'),
      endsAt: new Date('2024-01-01T16:00:00.000Z'),
    });

    await expect(
      service.update('org-1', 'shift-1', {
        startsAt: '2024-01-01T18:00:00.000Z',
      }),
    ).rejects.toThrow('startsAt must be before endsAt');
  });
});
