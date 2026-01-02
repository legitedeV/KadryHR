import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Weekday } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';

const OVERLAP_ERROR = 'Employee already has a shift in this time range';
const AVAILABILITY_WARNING = 'Zmiana poza deklarowaną dostępnością';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateChronology(startsAt: Date, endsAt: Date) {
    if (startsAt >= endsAt) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
  }

  private validateRange(from: Date, to: Date) {
    if (from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }
  }

  private async ensureEmployee(
    organisationId: string,
    employeeId: string,
  ): Promise<void> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      select: { id: true },
    });

    if (!employee) {
      throw new BadRequestException(
        'Employee does not belong to this organisation',
      );
    }
  }

  private async ensureLocation(
    organisationId: string,
    locationId?: string,
  ): Promise<void> {
    if (!locationId) return;
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
      select: { id: true },
    });

    if (!location) {
      throw new BadRequestException(
        'Location does not belong to this organisation',
      );
    }
  }

  private async ensureNoConflict(
    organisationId: string,
    employeeId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ) {
    const conflict = await this.prisma.shift.findFirst({
      where: {
        organisationId,
        employeeId,
        id: excludeId ? { not: excludeId } : undefined,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });

    if (conflict) {
      throw new BadRequestException(OVERLAP_ERROR);
    }
  }

  private weekdayFromDate(date: Date): Weekday {
    const map: Record<number, Weekday> = {
      0: Weekday.SUNDAY,
      1: Weekday.MONDAY,
      2: Weekday.TUESDAY,
      3: Weekday.WEDNESDAY,
      4: Weekday.THURSDAY,
      5: Weekday.FRIDAY,
      6: Weekday.SATURDAY,
    };
    return map[date.getUTCDay()];
  }

  private minutesFromDate(date: Date) {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  private dayBounds(date: Date) {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private async getAvailabilityWarning(
    organisationId: string,
    employeeId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const { start, end } = this.dayBounds(startsAt);
    const weekday = this.weekdayFromDate(startsAt);

    const availability = await this.prisma.availability.findMany({
      where: {
        organisationId,
        employeeId,
        OR: [{ date: { gte: start, lt: end } }, { weekday }],
      },
      select: {
        startMinutes: true,
        endMinutes: true,
      },
    });

    if (!availability.length) {
      return AVAILABILITY_WARNING;
    }

    const shiftStart = this.minutesFromDate(startsAt);
    const shiftEnd = this.minutesFromDate(endsAt);
    const fits = availability.some(
      (slot) => slot.startMinutes <= shiftStart && slot.endMinutes >= shiftEnd,
    );

    if (!fits) {
      return AVAILABILITY_WARNING;
    }

    return undefined;
  }

  async findAll(
    organisationId: string,
    query: QueryShiftsDto,
    options?: { restrictEmployeeId?: string },
  ) {
    const fromRaw = new Date(query.from);
    const toRaw = new Date(query.to);
    this.validateRange(fromRaw, toRaw);
    const from = this.dayBounds(fromRaw).start;
    const to = this.dayBounds(toRaw).end;

    if (query.employeeId || options?.restrictEmployeeId) {
      await this.ensureEmployee(
        organisationId,
        options?.restrictEmployeeId ?? query.employeeId!,
      );
    }
    if (query.locationId) {
      await this.ensureLocation(organisationId, query.locationId);
    }

    const employeeId = options?.restrictEmployeeId ?? query.employeeId;

    const where: Prisma.ShiftWhereInput = {
      organisationId,
      startsAt: { gte: from },
      endsAt: { lte: to },
      employeeId: employeeId,
      locationId: query.locationId,
    };

    return this.prisma.shift.findMany({
      where,
      include: {
        employee: true,
        location: true,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async create(organisationId: string, dto: CreateShiftDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.validateChronology(startsAt, endsAt);
    await this.ensureEmployee(organisationId, dto.employeeId);
    await this.ensureLocation(organisationId, dto.locationId);
    await this.ensureNoConflict(
      organisationId,
      dto.employeeId,
      startsAt,
      endsAt,
    );

    const availabilityWarning = await this.getAvailabilityWarning(
      organisationId,
      dto.employeeId,
      startsAt,
      endsAt,
    );

    const created = await this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt,
        endsAt,
      },
      include: { employee: true, location: true },
    });

    return { ...created, availabilityWarning };
  }

  async update(organisationId: string, shiftId: string, dto: UpdateShiftDto) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });
    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    const nextStartsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : existing.startsAt;
    const nextEndsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    const nextEmployeeId = dto.employeeId ?? existing.employeeId;

    if (dto.startsAt || dto.endsAt) {
      this.validateChronology(nextStartsAt, nextEndsAt);
    }

    await this.ensureEmployee(organisationId, nextEmployeeId);
    await this.ensureLocation(
      organisationId,
      dto.locationId ?? existing.locationId,
    );
    await this.ensureNoConflict(
      organisationId,
      nextEmployeeId,
      nextStartsAt,
      nextEndsAt,
      shiftId,
    );

    const availabilityWarning = await this.getAvailabilityWarning(
      organisationId,
      nextEmployeeId,
      nextStartsAt,
      nextEndsAt,
    );

    const updated = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt: dto.startsAt ? nextStartsAt : undefined,
        endsAt: dto.endsAt ? nextEndsAt : undefined,
      },
      include: { employee: true, location: true },
    });

    return { ...updated, availabilityWarning };
  }

  async remove(organisationId: string, shiftId: string) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.shift.delete({ where: { id: shiftId } });
    return { success: true };
  }

  async summary(
    organisationId: string,
    query: QueryShiftsDto,
    options?: { restrictEmployeeId?: string },
  ) {
    const fromRaw = new Date(query.from);
    const toRaw = new Date(query.to);
    this.validateRange(fromRaw, toRaw);
    const from = this.dayBounds(fromRaw).start;
    const to = this.dayBounds(toRaw).end;

    const employeeId = options?.restrictEmployeeId ?? query.employeeId;
    if (query.employeeId || options?.restrictEmployeeId) {
      await this.ensureEmployee(
        organisationId,
        options?.restrictEmployeeId ?? query.employeeId!,
      );
    }

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        startsAt: { gte: from },
        endsAt: { lte: to },
        employeeId: employeeId ?? undefined,
      },
      select: {
        employeeId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    const totals = new Map<string, number>();
    shifts.forEach((shift) => {
      const hours =
        (shift.endsAt.getTime() - shift.startsAt.getTime()) / (1000 * 60 * 60);
      totals.set(shift.employeeId, (totals.get(shift.employeeId) ?? 0) + hours);
    });

    const employeeIds = Array.from(totals.keys());
    const employees = employeeIds.length
      ? await this.prisma.employee.findMany({
          where: { organisationId, id: { in: employeeIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];

    return employeeIds.map((id) => {
      const employee = employees.find((e) => e.id === id);
      const label = employee
        ? `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() ||
          employee.email ||
          'Pracownik'
        : 'Pracownik';

      return {
        employeeId: id,
        employeeName: label,
        hours: Number((totals.get(id) ?? 0).toFixed(2)),
      };
    });
  }
}
