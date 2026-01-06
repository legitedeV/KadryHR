import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Weekday } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista dostępności w ramach organizacji z opcjonalnymi filtrami.
   */
  findAll(
    organisationId: string,
    query?: { from?: string; to?: string; employeeId?: string },
  ) {
    const where: Prisma.AvailabilityWhereInput = { organisationId };

    if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    // Filter by date range if provided
    if (query?.from || query?.to) {
      where.date = {};
      if (query?.from) {
        (where.date as Prisma.DateTimeNullableFilter).gte = new Date(
          query.from,
        );
      }
      if (query?.to) {
        (where.date as Prisma.DateTimeNullableFilter).lte = new Date(query.to);
      }
    }

    return this.prisma.availability.findMany({
      where,
      orderBy: [{ date: 'asc' }, { weekday: 'asc' }, { startMinutes: 'asc' }],
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Find employee by user ID
   */
  async findEmployeeByUserId(organisationId: string, userId: string) {
    return this.prisma.employee.findFirst({
      where: { organisationId, userId },
    });
  }

  /**
   * Tworzenie rekordu dostępności.
   */
  async create(organisationId: string, dto: any) {
    if (
      typeof dto.startMinutes === 'number' &&
      typeof dto.endMinutes === 'number' &&
      dto.endMinutes <= dto.startMinutes
    ) {
      throw new BadRequestException(
        'endMinutes must be greater than startMinutes',
      );
    }
    return this.prisma.availability.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        date: dto.date ?? null,
        weekday: dto.weekday ?? null,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        notes: dto.notes ?? null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Aktualizacja rekordu dostępności z kontrolą organizacji.
   */
  async update(organisationId: string, id: string, dto: any) {
    const existing = await this.prisma.availability.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    return this.prisma.availability.update({
      where: { id },
      data: {
        employeeId: dto.employeeId ?? existing.employeeId,
        date: dto.date ?? existing.date,
        weekday: dto.weekday ?? existing.weekday,
        startMinutes:
          typeof dto.startMinutes === 'number'
            ? dto.startMinutes
            : existing.startMinutes,
        endMinutes:
          typeof dto.endMinutes === 'number'
            ? dto.endMinutes
            : existing.endMinutes,
        notes: dto.notes ?? existing.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Usunięcie rekordu dostępności w ramach organizacji.
   */
  async remove(organisationId: string, id: string) {
    const existing = await this.prisma.availability.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    await this.prisma.availability.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Bulk upsert availability for an employee for a given week
   */
  async bulkUpsertForEmployee(
    organisationId: string,
    employeeId: string,
    availabilities: Array<{
      weekday?: string;
      date?: string;
      startMinutes: number;
      endMinutes: number;
      notes?: string;
    }>,
  ) {
    // Delete existing availability for this employee in the date range
    // For weekday-based availability, we'll delete any with matching weekdays
    const weekdays = availabilities
      .filter((a) => a.weekday)
      .map((a) => a.weekday as Weekday);

    if (weekdays.length > 0) {
      await this.prisma.availability.deleteMany({
        where: {
          organisationId,
          employeeId,
          weekday: { in: weekdays },
        },
      });
    }

    // Create new availability records
    const created = await this.prisma.$transaction(
      availabilities.map((avail) =>
        this.prisma.availability.create({
          data: {
            organisationId,
            employeeId,
            date: avail.date ?? null,
            weekday: (avail.weekday as Weekday) ?? null,
            startMinutes: avail.startMinutes,
            endMinutes: avail.endMinutes,
            notes: avail.notes ?? null,
          },
        }),
      ),
    );

    return created;
  }
}
