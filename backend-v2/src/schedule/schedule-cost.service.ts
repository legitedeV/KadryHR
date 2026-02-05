import { Injectable } from '@nestjs/common';
import { ScheduleRepository } from './schedule.repository';
import { EmployeeContractsService } from '../employee-contracts/employee-contracts.service';
import type { Shift } from '@prisma/client';
import { buildScheduleRange } from './schedule-date.utils';

const BREAK_REGEX = /przerwa:\s*(\d+)\s*min/i;

@Injectable()
export class ScheduleCostService {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly employeeContractsService: EmployeeContractsService,
  ) {}

  calculateShiftHours(shift: Pick<Shift, 'startsAt' | 'endsAt' | 'note' | 'notes'>) {
    const start = new Date(shift.startsAt).getTime();
    const end = new Date(shift.endsAt).getTime();
    const totalMinutes = Math.max(0, (end - start) / 60000);
    const noteValue = shift.notes ?? shift.note ?? '';
    const breakMatch = noteValue.match(BREAK_REGEX);
    const breakMinutes = breakMatch ? Number(breakMatch[1]) : 0;
    return Math.max(0, (totalMinutes - breakMinutes) / 60);
  }

  async getEmployeeContractForShift(
    shift: Pick<Shift, 'employeeId' | 'organisationId' | 'startsAt'>,
  ) {
    return this.employeeContractsService.getActiveContractForEmployee(
      shift.employeeId,
      shift.organisationId,
      new Date(shift.startsAt),
    );
  }

  async calculateShiftCost(shift: Shift) {
    const hours = this.calculateShiftHours(shift);
    const contract = await this.getEmployeeContractForShift(shift);

    if (!contract || !contract.compensation) {
      return {
        hours,
        cost: null as number | null,
        currency: null as string | null,
        hasRate: false,
        reason: contract ? 'missing_rate' : 'missing_contract',
      };
    }

    const cost = hours * contract.compensation.amount;
    return {
      hours,
      cost,
      currency: contract.compensation.currency,
      hasRate: true,
    };
  }

  async calculateScheduleSummary(params: {
    organisationId: string;
    from: string;
    to: string;
    locationIds?: string[];
    positionIds?: string[];
  }) {
    const { from, to, toExclusive } = buildScheduleRange(params.from, params.to);
    const shifts = await this.scheduleRepository.findShifts({
      where: {
        organisationId: params.organisationId,
        startsAt: { gte: from, lt: toExclusive },
        locationId: params.locationIds?.length
          ? { in: params.locationIds }
          : undefined,
        positionId: params.positionIds?.length
          ? { in: params.positionIds }
          : undefined,
        deletedAt: null,
      },
      orderBy: { startsAt: 'asc' },
    });

    const totals = {
      hours: 0,
      cost: 0,
      currency: null as string | null,
      shiftsCount: shifts.length,
      shiftsWithoutRate: 0,
      employeesWithoutRate: 0,
    };

    const missingRateEmployees = new Set<string>();
    const byDayMap = new Map<string, { date: string; hours: number; cost: number }>();

    for (const shift of shifts) {
      const result = await this.calculateShiftCost(shift);
      totals.hours += result.hours;

      const dayKey = shift.startsAt.toISOString().slice(0, 10);
      const current = byDayMap.get(dayKey) ?? { date: dayKey, hours: 0, cost: 0 };
      current.hours += result.hours;

      if (result.hasRate && result.cost !== null) {
        totals.cost += result.cost;
        if (!totals.currency) {
          totals.currency = result.currency ?? null;
        }
        current.cost += result.cost;
      } else {
        totals.shiftsWithoutRate += 1;
        missingRateEmployees.add(shift.employeeId);
      }

      byDayMap.set(dayKey, current);
    }

    totals.employeesWithoutRate = missingRateEmployees.size;

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      totals: {
        hours: Number(totals.hours.toFixed(2)),
        cost: Number(totals.cost.toFixed(2)),
        currency: totals.currency ?? 'PLN',
        shiftsCount: totals.shiftsCount,
        shiftsWithoutRate: totals.shiftsWithoutRate,
        employeesWithoutRate: totals.employeesWithoutRate,
      },
      byDay: Array.from(byDayMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }
}
