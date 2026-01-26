import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleTemplatesService } from './schedule-templates.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  scheduleTemplate: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  shift: {
    findMany: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
  },
};

describe('ScheduleTemplatesService', () => {
  let service: ScheduleTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleTemplatesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScheduleTemplatesService>(ScheduleTemplatesService);
    jest.clearAllMocks();
  });

  it('throws when no shifts exist in week', async () => {
    mockPrisma.shift.findMany.mockResolvedValue([]);

    await expect(
      service.createFromWeek('org-1', {
        name: 'Tydzień bez zmian',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-07T23:59:59.000Z',
      }),
    ).rejects.toThrow('Brak zmian w wybranym tygodniu');
  });

  it('creates template from week shifts', async () => {
    mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1' });
    mockPrisma.shift.findMany.mockResolvedValue([
      {
        employeeId: 'emp-1',
        locationId: 'loc-1',
        position: 'Barista',
        notes: 'Test',
        color: '#ff0000',
        startsAt: new Date('2024-01-01T08:00:00.000Z'),
        endsAt: new Date('2024-01-01T12:00:00.000Z'),
      },
    ]);
    mockPrisma.scheduleTemplate.create.mockResolvedValue({
      id: 'tpl-1',
      name: 'Week',
      _count: { shifts: 1 },
    });

    const result = await service.createFromWeek(
      'org-1',
      {
        name: 'Week',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-01-07T23:59:59.000Z',
        locationId: 'loc-1',
      },
      'user-1',
    );

    expect(mockPrisma.scheduleTemplate.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: 'tpl-1',
      name: 'Week',
      _count: { shifts: 1 },
    });
  });
});
