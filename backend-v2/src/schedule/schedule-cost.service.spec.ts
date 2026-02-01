import { ScheduleCostService } from './schedule-cost.service';
import { ScheduleRepository } from './schedule.repository';
import { EmployeeContractsService } from '../employee-contracts/employee-contracts.service';

const baseShift = {
  id: 'shift-1',
  organisationId: 'org-1',
  employeeId: 'emp-1',
  startsAt: new Date('2024-02-01T08:00:00Z'),
  endsAt: new Date('2024-02-01T16:00:00Z'),
  note: 'Przerwa: 30 min',
  notes: null,
};

describe('ScheduleCostService', () => {
  let service: ScheduleCostService;
  let scheduleRepository: jest.Mocked<ScheduleRepository>;
  let contractsService: jest.Mocked<EmployeeContractsService>;

  beforeEach(() => {
    scheduleRepository = {
      findShifts: jest.fn(),
    } as unknown as jest.Mocked<ScheduleRepository>;

    contractsService = {
      getActiveContractForEmployee: jest.fn(),
    } as unknown as jest.Mocked<EmployeeContractsService>;

    service = new ScheduleCostService(scheduleRepository, contractsService);
  });

  it('calculates shift hours with break deduction', () => {
    const hours = service.calculateShiftHours(baseShift as any);
    expect(hours).toBeCloseTo(7.5, 2);
  });

  it('builds schedule summary with missing rate counts', async () => {
    scheduleRepository.findShifts.mockResolvedValue([
      baseShift as any,
      {
        ...baseShift,
        id: 'shift-2',
        employeeId: 'emp-2',
        startsAt: new Date('2024-02-02T10:00:00Z'),
        endsAt: new Date('2024-02-02T14:00:00Z'),
        note: null,
      } as any,
    ]);

    contractsService.getActiveContractForEmployee
      .mockResolvedValueOnce({
        id: 'contract-1',
        compensation: { amount: 40, currency: 'PLN' },
      } as any)
      .mockResolvedValueOnce(null);

    const summary = await service.calculateScheduleSummary({
      organisationId: 'org-1',
      from: new Date('2024-02-01T00:00:00Z'),
      to: new Date('2024-02-03T00:00:00Z'),
    });

    expect(summary.totals.shiftsCount).toBe(2);
    expect(summary.totals.shiftsWithoutRate).toBe(1);
    expect(summary.totals.employeesWithoutRate).toBe(1);
    expect(summary.totals.cost).toBeGreaterThan(0);
    expect(summary.byDay.length).toBe(2);
  });
});
