import { ScheduleRepository } from './schedule.repository';

const mockPrisma = {
  schedulePeriod: {
    findMany: jest.fn(),
  },
  shift: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  scheduleAudit: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  scheduleValidation: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
  },
  location: {
    findMany: jest.fn(),
  },
  position: {
    findMany: jest.fn(),
  },
};

describe('ScheduleRepository', () => {
  let repository: ScheduleRepository;

  beforeEach(() => {
    repository = new ScheduleRepository(mockPrisma as never);
    jest.clearAllMocks();
  });

  it('returns empty list when period ids are missing', async () => {
    const result = await repository.findPeriodsByIds('org-1', [
      undefined,
      '',
      '   ',
    ] as unknown as string[]);

    expect(result).toEqual([]);
    expect(mockPrisma.schedulePeriod.findMany).not.toHaveBeenCalled();
  });

  it('filters invalid ids before querying', async () => {
    mockPrisma.schedulePeriod.findMany.mockResolvedValue([
      { id: 'period-1', status: 'DRAFT' },
    ]);

    const result = await repository.findPeriodsByIds('org-1', [
      'period-1',
      undefined,
      '',
    ] as unknown as string[]);

    expect(mockPrisma.schedulePeriod.findMany).toHaveBeenCalledWith({
      where: {
        organisationId: 'org-1',
        id: { in: ['period-1'] },
      },
      select: { id: true, status: true },
    });
    expect(result).toEqual([{ id: 'period-1', status: 'DRAFT' }]);
  });
});
