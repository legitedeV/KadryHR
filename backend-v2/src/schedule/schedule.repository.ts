import { Injectable } from '@nestjs/common';
import { Prisma, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findShifts(params: Prisma.ShiftFindManyArgs) {
    return this.prisma.shift.findMany(params);
  }

  findPeriodsByIds(organisationId: string, periodIds: string[]) {
    return this.prisma.schedulePeriod.findMany({
      where: {
        organisationId,
        id: { in: periodIds },
      },
      select: { id: true, status: true },
    });
  }

  findPeriodById(organisationId: string, periodId: string) {
    return this.prisma.schedulePeriod.findFirst({
      where: { organisationId, id: periodId },
      select: {
        id: true,
        from: true,
        to: true,
        status: true,
        version: true,
        locationId: true,
        publishedAt: true,
        publishedById: true,
      },
    });
  }

  findPreviousPeriods(
    organisationId: string,
    locationId: string,
    beforeDate: Date,
  ) {
    return this.prisma.schedulePeriod.findMany({
      where: {
        organisationId,
        locationId,
        from: { lt: beforeDate },
      },
      orderBy: { from: 'desc' },
      take: 10,
    });
  }

  updatePeriodPublish(
    periodId: string,
    data: Prisma.SchedulePeriodUpdateInput,
  ) {
    return this.prisma.schedulePeriod.update({
      where: { id: periodId },
      data,
    });
  }

  updateShiftsStatusForPeriod(
    organisationId: string,
    periodId: string,
    status: ScheduleStatus,
    actorId?: string,
  ) {
    return this.prisma.shift.updateMany({
      where: {
        organisationId,
        periodId,
        deletedAt: null,
      },
      data: {
        status,
        updatedById: actorId ?? null,
      },
    });
  }

  createShift(data: Prisma.ShiftCreateInput) {
    return this.prisma.shift.create({ data });
  }

  createShifts(data: Prisma.ShiftCreateManyInput[]) {
    return this.prisma.shift.createMany({ data });
  }

  findShiftsByIds(organisationId: string, shiftIds: string[]) {
    return this.prisma.shift.findMany({
      where: {
        organisationId,
        id: { in: shiftIds },
      },
    });
  }

  findShiftsByPeriod(organisationId: string, periodId: string) {
    return this.prisma.shift.findMany({
      where: {
        organisationId,
        periodId,
        deletedAt: null,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  findShiftsWithEmployeesByPeriod(organisationId: string, periodId: string) {
    return this.prisma.shift.findMany({
      where: {
        organisationId,
        periodId,
        deletedAt: null,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, userId: true },
        },
      },
    });
  }

  deleteShiftsByPeriod(organisationId: string, periodId: string) {
    return this.prisma.shift.deleteMany({
      where: {
        organisationId,
        periodId,
      },
    });
  }

  deleteShifts(organisationId: string, shiftIds: string[]) {
    return this.prisma.shift.deleteMany({
      where: {
        organisationId,
        id: { in: shiftIds },
      },
    });
  }

  createAudit(data: Prisma.ScheduleAuditCreateInput) {
    return this.prisma.scheduleAudit.create({ data });
  }

  createAuditMany(data: Prisma.ScheduleAuditCreateManyInput[]) {
    return this.prisma.scheduleAudit.createMany({ data });
  }

  deleteValidationsForPeriod(organisationId: string, periodId: string) {
    return this.prisma.scheduleValidation.deleteMany({
      where: { organisationId, periodId },
    });
  }

  createValidations(data: Prisma.ScheduleValidationCreateManyInput[]) {
    return this.prisma.scheduleValidation.createMany({ data });
  }

  countValidationErrors(organisationId: string, periodId: string) {
    return this.prisma.scheduleValidation.count({
      where: {
        organisationId,
        periodId,
        severity: 'ERROR',
      },
    });
  }

  findEmployeesByIds(organisationId: string, employeeIds: string[]) {
    return this.prisma.employee.findMany({
      where: {
        organisationId,
        id: { in: employeeIds },
        isDeleted: false,
        isActive: true,
      },
      select: { id: true },
    });
  }

  findLocationsByIds(organisationId: string, locationIds: string[]) {
    return this.prisma.location.findMany({
      where: {
        organisationId,
        id: { in: locationIds },
      },
      select: { id: true },
    });
  }

  findPositionsByIds(organisationId: string, positionIds: string[]) {
    return this.prisma.position.findMany({
      where: {
        organisationId,
        id: { in: positionIds },
      },
      select: { id: true },
    });
  }
}
