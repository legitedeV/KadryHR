import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractType } from '@prisma/client';

interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  hours: number;
  shifts: number;
}

interface LocationSummary {
  locationId: string | null;
  locationName: string;
  hours: number;
  shifts: number;
}

export interface PayrollSummary {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    position: string | null;
  };
  month: string;
  contract: {
    id: string;
    type: ContractType;
    position: string | null;
  } | null;
  compensation: {
    type: 'MONTHLY_SALARY' | 'HOURLY_RATE';
    amount: number;
    currency: string;
  } | null;
  summary: {
    totalHours: number;
    totalShifts: number;
    estimatedGross: number;
    overtime: number; // Placeholder for future
  };
  byWeek: WeekSummary[];
  byLocation: LocationSummary[];
}

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    organisationId: string,
    employeeId: string,
    month: string,
  ): Promise<PayrollSummary> {
    // month format: YYYY-MM
    const [year, monthStr] = month.split('-');
    const startDate = new Date(`${year}-${monthStr}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Get employee
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: endDate },
            OR: [{ endDate: null }, { endDate: { gte: startDate } }],
          },
          include: {
            compensations: {
              where: {
                effectiveFrom: { lte: endDate },
                OR: [
                  { effectiveTo: null },
                  { effectiveTo: { gte: startDate } },
                ],
              },
              orderBy: { effectiveFrom: 'desc' },
              take: 1,
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get shifts for the month
    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        employeeId,
        startsAt: { gte: startDate, lt: endDate },
      },
      include: {
        location: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    // Calculate hours
    let totalHours = 0;
    const weekMap = new Map<string, WeekSummary>();
    const locationMap = new Map<string | null, LocationSummary>();

    for (const shift of shifts) {
      const start = new Date(shift.startsAt);
      const end = new Date(shift.endsAt);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      totalHours += hours;

      // Group by week
      const weekStart = this.getWeekStart(start);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekKey = weekStart.toISOString().slice(0, 10);

      const weekData = weekMap.get(weekKey) || {
        weekStart: weekKey,
        weekEnd: weekEnd.toISOString().slice(0, 10),
        hours: 0,
        shifts: 0,
      };
      weekData.hours += hours;
      weekData.shifts += 1;
      weekMap.set(weekKey, weekData);

      // Group by location
      const locId = shift.locationId;
      const locName = shift.location?.name || 'Bez lokalizacji';
      const locData = locationMap.get(locId) || {
        locationId: locId,
        locationName: locName,
        hours: 0,
        shifts: 0,
      };
      locData.hours += hours;
      locData.shifts += 1;
      locationMap.set(locId, locData);
    }

    // Get contract and compensation
    const contract = employee.contracts[0] || null;
    const compensation = contract?.compensations[0] || null;

    // Estimate gross based on compensation
    let estimatedGross = 0;
    if (compensation) {
      if (compensation.type === 'HOURLY_RATE') {
        estimatedGross = totalHours * compensation.amount;
      } else if (compensation.type === 'MONTHLY_SALARY') {
        // For monthly salary, we can prorate based on days worked vs total days
        // Or just show the monthly amount (Phase 1 simplification)
        estimatedGross = compensation.amount;
      }
    }

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
      },
      month,
      contract: contract
        ? {
            id: contract.id,
            type: contract.type,
            position: contract.position,
          }
        : null,
      compensation: compensation
        ? {
            type: compensation.type,
            amount: compensation.amount,
            currency: compensation.currency,
          }
        : null,
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalShifts: shifts.length,
        estimatedGross: Math.round(estimatedGross * 100) / 100,
        overtime: 0, // Placeholder for Phase 2
      },
      byWeek: Array.from(weekMap.values()).map((w) => ({
        ...w,
        hours: Math.round(w.hours * 100) / 100,
      })),
      byLocation: Array.from(locationMap.values()).map((l) => ({
        ...l,
        hours: Math.round(l.hours * 100) / 100,
      })),
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async exportToCSV(
    organisationId: string,
    employeeId: string,
    month: string,
  ): Promise<string> {
    const summary = await this.getSummary(organisationId, employeeId, month);

    const lines: string[] = [];
    lines.push('# Podsumowanie wynagrodzeń');
    lines.push(
      `# Pracownik: ${summary.employee.firstName} ${summary.employee.lastName}`,
    );
    lines.push(`# Miesiąc: ${summary.month}`);
    lines.push('');

    lines.push('Podsumowanie ogólne');
    lines.push('Kategoria,Wartość');
    lines.push(`Łączne godziny,${summary.summary.totalHours}`);
    lines.push(`Liczba zmian,${summary.summary.totalShifts}`);
    lines.push(
      `Szacowane wynagrodzenie brutto (PLN),${summary.summary.estimatedGross}`,
    );
    lines.push('');

    lines.push('Podział na tygodnie');
    lines.push('Tydzień (start),Tydzień (koniec),Godziny,Liczba zmian');
    for (const week of summary.byWeek) {
      lines.push(
        `${week.weekStart},${week.weekEnd},${week.hours},${week.shifts}`,
      );
    }
    lines.push('');

    lines.push('Podział na lokalizacje');
    lines.push('Lokalizacja,Godziny,Liczba zmian');
    for (const loc of summary.byLocation) {
      lines.push(`${loc.locationName},${loc.hours},${loc.shifts}`);
    }

    return lines.join('\n');
  }
}
