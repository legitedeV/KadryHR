/* eslint-disable @typescript-eslint/unbound-method */
import { EmployeeContractsService } from './employee-contracts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContractStatus, CompensationType } from '@prisma/client';

const baseContract = {
  id: 'contract-1',
  organisationId: 'org-1',
  employeeId: 'emp-1',
  type: 'UOP',
  status: ContractStatus.ACTIVE,
  workTimeType: 'FULL_TIME',
  startDate: new Date('2024-01-01T00:00:00Z'),
  endDate: null,
  position: null,
  notes: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

describe('EmployeeContractsService', () => {
  let service: EmployeeContractsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      employee: {
        findFirst: jest.fn(),
      },
      employmentContract: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      compensation: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback(prisma)),
    } as unknown as jest.Mocked<PrismaService>;

    service = new EmployeeContractsService(prisma);
  });

  it('closes previous active contract when creating a new one', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' } as any);
    prisma.employmentContract.findFirst
      .mockResolvedValueOnce({ ...baseContract })
      .mockResolvedValueOnce({
        ...baseContract,
        id: 'contract-new',
        startDate: new Date('2024-03-01T00:00:00Z'),
        compensations: [
          {
            type: CompensationType.HOURLY_RATE,
            amount: 40,
            currency: 'PLN',
            effectiveFrom: new Date('2024-03-01T00:00:00Z'),
            effectiveTo: null,
          },
        ],
      } as any);

    prisma.employmentContract.create.mockResolvedValue({
      ...baseContract,
      id: 'contract-new',
      startDate: new Date('2024-03-01T00:00:00Z'),
    } as any);

    const result = await service.createContract('org-1', 'emp-1', {
      contractType: 'UOP',
      hourlyRate: 40,
      currency: 'PLN',
      validFrom: '2024-03-01T00:00:00Z',
    });

    expect(prisma.employmentContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contract-1' },
        data: expect.objectContaining({ status: ContractStatus.ENDED }),
      }),
    );
    expect(prisma.compensation.updateMany).toHaveBeenCalled();
    expect(result.contractType).toBe('UOP');
    expect(result.hourlyRate).toBe(40);
  });

  it('returns active contract with compensation for date', async () => {
    prisma.employmentContract.findFirst.mockResolvedValue(baseContract as any);
    prisma.compensation.findFirst.mockResolvedValue({
      id: 'comp-1',
      contractId: baseContract.id,
      type: CompensationType.HOURLY_RATE,
      amount: 50,
      currency: 'PLN',
      effectiveFrom: new Date('2024-01-01T00:00:00Z'),
      effectiveTo: null,
    } as any);

    const result = await service.getActiveContractForEmployee(
      'emp-1',
      'org-1',
      new Date('2024-02-01T00:00:00Z'),
    );

    expect(result?.id).toBe('contract-1');
    expect(result?.compensation?.amount).toBe(50);
  });
});
