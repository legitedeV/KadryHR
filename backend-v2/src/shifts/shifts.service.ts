import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryShiftsDto } from './dto/query-shifts.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wszystkie zmiany w organizacji (dla OWNER/MANAGER).
   */
  findAll(organisationId: string, query?: Partial<QueryShiftsDto>) {
    const where: Prisma.ShiftWhereInput = {
      organisationId,
    };

    if (query?.from) {
      where.startsAt = { gte: new Date(query.from) };
    }

    if (query?.to) {
      where.endsAt = { lte: new Date(query.to) };
    }

    if (query?.locationId) {
      where.locationId = query.locationId;
    }

    if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    return this.prisma.shift.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  /**
   * Zmiany dla konkretnego pracownika (EMPLOYEE view).
   */
  findForEmployee(
    organisationId: string,
    employeeId: string,
    query?: Partial<QueryShiftsDto>,
  ) {
    return this.findAll(organisationId, { ...query, employeeId });
  }

  /**
   * Tworzenie zmiany.
   */
  create(organisationId: string, dto: any) {
    return this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId ?? null,
        position: dto.position ?? null,
        notes: dto.notes ?? null,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
      },
    });
  }

  /**
   * Aktualizacja zmiany z kontrolą organisationId.
   */
  async update(organisationId: string, id: string, dto: any) {
    const existing = await this.prisma.shift.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        employeeId: dto.employeeId ?? existing.employeeId,
        locationId:
          dto.locationId !== undefined ? dto.locationId : existing.locationId,
        position: dto.position ?? existing.position,
        notes: dto.notes ?? existing.notes,
        startsAt: dto.startsAt ?? existing.startsAt,
        endsAt: dto.endsAt ?? existing.endsAt,
      },
    });
  }

  /**
   * Usunięcie zmiany z kontrolą organisationId.
   */
  async remove(organisationId: string, id: string) {
    const existing = await this.prisma.shift.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.shift.delete({
      where: { id },
    });

    return { success: true };
  }

  async summary(organisationId: string, query: QueryShiftsDto) {
    const where: Prisma.ShiftWhereInput = {
      organisationId,
    };

    if (query.from) {
      where.startsAt = { gte: new Date(query.from) };
    }

    if (query.to) {
      where.endsAt = { lte: new Date(query.to) };
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      select: {
        employeeId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (shifts.length === 0) {
      return [];
    }

    const totals = new Map<string, number>();

    for (const shift of shifts) {
      const durationHours = Math.max(
        0,
        (new Date(shift.endsAt).getTime() -
          new Date(shift.startsAt).getTime()) /
          (1000 * 60 * 60),
      );

      totals.set(
        shift.employeeId,
        (totals.get(shift.employeeId) ?? 0) + durationHours,
      );
    }

    const employeeIds = Array.from(totals.keys());
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    return employeeIds.map((id) => {
      const employee = employees.find((e) => e.id === id);
      const fullName = [employee?.firstName, employee?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        employeeId: id,
        employeeName: fullName || employee?.email || 'Nieznany pracownik',
        hours: Math.round((totals.get(id) ?? 0) * 100) / 100,
      };
    });
  }
}
