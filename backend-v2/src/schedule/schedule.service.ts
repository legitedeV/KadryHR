import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ScheduleStatus } from '@prisma/client';
import { ScheduleRepository } from './schedule.repository';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { CreateScheduleShiftDto } from './dto/create-schedule-shift.dto';
import { BulkCreateShiftsDto } from './dto/bulk-create-shifts.dto';
import { BulkDeleteShiftsDto } from './dto/bulk-delete-shifts.dto';

type ErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

@Injectable()
export class ScheduleService {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async getSchedule(organisationId: string, query: QueryScheduleDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    return this.scheduleRepository.findShifts({
      where: {
        organisationId,
        startsAt: { gte: from },
        endsAt: { lte: to },
        locationId: query.locationIds?.length
          ? { in: query.locationIds }
          : undefined,
        positionId: query.positionIds?.length
          ? { in: query.positionIds }
          : undefined,
        deletedAt: null,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createShift(
    organisationId: string,
    actorId: string,
    dto: CreateScheduleShiftDto,
  ) {
    await this.ensureEditablePeriods(organisationId, dto.periodId);
    await this.ensureEntitiesExist(
      organisationId,
      [dto.employeeId],
      dto.locationId ? [dto.locationId] : [],
      dto.positionId ? [dto.positionId] : [],
    );
    this.validateRange(dto.startAt, dto.endAt);

    const shift = await this.scheduleRepository.createShift({
      organisation: { connect: { id: organisationId } },
      employee: { connect: { id: dto.employeeId } },
      location: dto.locationId ? { connect: { id: dto.locationId } } : undefined,
      period: dto.periodId ? { connect: { id: dto.periodId } } : undefined,
      positionRef: dto.positionId
        ? { connect: { id: dto.positionId } }
        : undefined,
      position: dto.position,
      note: dto.note,
      startsAt: new Date(dto.startAt),
      endsAt: new Date(dto.endAt),
      status: ScheduleStatus.DRAFT,
      createdBy: { connect: { id: actorId } },
      updatedBy: { connect: { id: actorId } },
    });

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'Shift',
      entityId: shift.id,
      action: 'SHIFT_CREATE',
      afterJson: shift as unknown as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    return shift;
  }

  async createShiftsBulk(
    organisationId: string,
    actorId: string,
    dto: BulkCreateShiftsDto,
  ) {
    const periodIds = dto.shifts
      .map((shift) => shift.periodId)
      .filter((id): id is string => Boolean(id));
    await this.ensureEditablePeriods(organisationId, ...periodIds);

    dto.shifts.forEach((shift) => this.validateRange(shift.startAt, shift.endAt));
    await this.ensureEntitiesExist(
      organisationId,
      dto.shifts.map((shift) => shift.employeeId),
      dto.shifts.map((shift) => shift.locationId).filter(Boolean) as string[],
      dto.shifts.map((shift) => shift.positionId).filter(Boolean) as string[],
    );

    const created = await Promise.all(
      dto.shifts.map((shift) =>
        this.scheduleRepository.createShift({
          organisation: { connect: { id: organisationId } },
          employee: { connect: { id: shift.employeeId } },
          location: shift.locationId
            ? { connect: { id: shift.locationId } }
            : undefined,
          period: shift.periodId ? { connect: { id: shift.periodId } } : undefined,
          positionRef: shift.positionId
            ? { connect: { id: shift.positionId } }
            : undefined,
          position: shift.position,
          note: shift.note,
          startsAt: new Date(shift.startAt),
          endsAt: new Date(shift.endAt),
          status: ScheduleStatus.DRAFT,
          createdBy: { connect: { id: actorId } },
          updatedBy: { connect: { id: actorId } },
        }),
      ),
    );

    await this.scheduleRepository.createAuditMany(
      created.map((shift) => ({
        organisationId,
        entityType: 'Shift',
        entityId: shift.id,
        action: 'SHIFT_CREATE',
        afterJson: shift as unknown as Prisma.JsonObject,
        actorId,
      })),
    );

    return { createdCount: created.length };
  }

  async deleteShiftsBulk(
    organisationId: string,
    actorId: string,
    dto: BulkDeleteShiftsDto,
  ) {
    const shifts = await this.scheduleRepository.findShiftsByIds(
      organisationId,
      dto.shiftIds,
    );

    if (shifts.length === 0) {
      throw new NotFoundException(
        this.buildError('SHIFT_NOT_FOUND', 'Shifts not found'),
      );
    }

    const periodIds = shifts
      .map((shift) => shift.periodId)
      .filter((id): id is string => Boolean(id));
    await this.ensureEditablePeriods(organisationId, ...periodIds);

    await this.scheduleRepository.deleteShifts(organisationId, dto.shiftIds);

    await this.scheduleRepository.createAuditMany(
      shifts.map((shift) => ({
        organisationId,
        entityType: 'Shift',
        entityId: shift.id,
        action: 'SHIFT_DELETE',
        beforeJson: shift as unknown as Prisma.JsonObject,
        actorId,
      })),
    );

    return { deletedCount: shifts.length };
  }

  private validateRange(startAt: string, endAt: string) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      throw new BadRequestException(
        this.buildError('INVALID_DATE', 'Invalid date format'),
      );
    }
    if (start >= end) {
      throw new BadRequestException(
        this.buildError('INVALID_RANGE', 'Shift start must be before end'),
      );
    }
  }

  private async ensureEditablePeriods(
    organisationId: string,
    ...periodIds: string[]
  ) {
    if (periodIds.length === 0) return;
    const uniqueIds = Array.from(new Set(periodIds));
    const periods = await this.scheduleRepository.findPeriodsByIds(
      organisationId,
      uniqueIds,
    );

    if (periods.length !== uniqueIds.length) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    const published = periods.find(
      (period) => period.status === ScheduleStatus.PUBLISHED,
    );
    if (published) {
      throw new BadRequestException(
        this.buildError('PERIOD_LOCKED', 'Schedule period is published', {
          periodId: published.id,
        }),
      );
    }
  }

  private async ensureEntitiesExist(
    organisationId: string,
    employeeIds: string[],
    locationIds: string[],
    positionIds: string[],
  ) {
    const uniqueEmployees = Array.from(new Set(employeeIds));
    const uniqueLocations = Array.from(new Set(locationIds));
    const uniquePositions = Array.from(new Set(positionIds));

    if (uniqueEmployees.length > 0) {
      const employees = await this.scheduleRepository.findEmployeesByIds(
        organisationId,
        uniqueEmployees,
      );
      if (employees.length !== uniqueEmployees.length) {
        throw new NotFoundException(
          this.buildError('EMPLOYEE_NOT_FOUND', 'Employee not found'),
        );
      }
    }

    if (uniqueLocations.length > 0) {
      const locations = await this.scheduleRepository.findLocationsByIds(
        organisationId,
        uniqueLocations,
      );
      if (locations.length !== uniqueLocations.length) {
        throw new NotFoundException(
          this.buildError('LOCATION_NOT_FOUND', 'Location not found'),
        );
      }
    }

    if (uniquePositions.length > 0) {
      const positions = await this.scheduleRepository.findPositionsByIds(
        organisationId,
        uniquePositions,
      );
      if (positions.length !== uniquePositions.length) {
        throw new NotFoundException(
          this.buildError('POSITION_NOT_FOUND', 'Position not found'),
        );
      }
    }
  }

  private buildError(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ): ErrorPayload {
    return { code, message, details };
  }
}
