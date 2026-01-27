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
