import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  availability: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
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
});
