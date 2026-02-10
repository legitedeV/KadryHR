import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ScheduleStatus,
  ScheduleValidationSeverity,
  NotificationType,
} from '@prisma/client';
import { ScheduleRepository } from './schedule.repository';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { CreateScheduleShiftDto } from './dto/create-schedule-shift.dto';
import { BulkCreateShiftsDto } from './dto/bulk-create-shifts.dto';
import { BulkDeleteShiftsDto } from './dto/bulk-delete-shifts.dto';
import { ValidateScheduleDto } from './dto/validate-schedule.dto';
import { PublishScheduleDto } from './dto/publish-schedule.dto';
import { DuplicatePreviousPeriodDto } from './dto/duplicate-prev.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplatesService } from '../email/email-templates.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-events';
import { buildScheduleRange } from './schedule-date.utils';

type ErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

@Injectable()
export class ScheduleService {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly notificationsService: NotificationsService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly auditService: AuditService,
  ) {}

  private buildAvatarUrl(
    avatarPath?: string | null,
    legacyUrl?: string | null,
  ): string | null {
    const pathValue = avatarPath || legacyUrl;
    if (!pathValue) return null;
    if (pathValue.startsWith('http')) return pathValue;
    if (pathValue.startsWith('/static/')) return pathValue;
    if (pathValue.startsWith('static/')) return `/${pathValue}`;
    if (pathValue.startsWith('avatars/')) return `/static/${pathValue}`;
    return pathValue;
  }

  async getSchedule(organisationId: string, query: QueryScheduleDto) {
    const { from, toExclusive } = buildScheduleRange(query.from, query.to);

    const shifts = await this.scheduleRepository.findShifts({
      where: {
        organisationId,
        startsAt: { gte: from, lt: toExclusive },
        locationId: query.locationIds?.length
          ? { in: query.locationIds }
          : undefined,
        positionId: query.positionIds?.length
          ? { in: query.positionIds }
          : undefined,
        deletedAt: null,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            avatarPath: true,
            updatedAt: true,
          },
        },
      },
    });

    const locationCandidates = query.locationIds?.length
      ? query.locationIds
      : Array.from(
          new Set(
            shifts
              .map((shift) => shift.locationId)
              .filter((id): id is string => Boolean(id)),
          ),
        );
    const locationId =
      locationCandidates.length === 1 ? locationCandidates[0] : null;

    const period = locationId
      ? await this.findOrCreatePeriod(organisationId, locationId, from, query.to)
      : null;

    const mappedShifts = shifts.map((shift) => {
      if (!shift.employee) return shift;
      const { avatarPath, avatarUrl, updatedAt, ...restEmployee } =
        shift.employee;
      return {
        ...shift,
        employee: {
          ...restEmployee,
          avatarUrl: this.buildAvatarUrl(avatarPath ?? null, avatarUrl ?? null),
          avatarUpdatedAt: updatedAt ?? null,
        },
      };
    });

    return {
      period,
      shifts: mappedShifts,
    };
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
    await this.ensureNoOverlap(
      organisationId,
      dto.employeeId,
      dto.startAt,
      dto.endAt,
    );

    const shift = await this.scheduleRepository.createShift({
      organisation: { connect: { id: organisationId } },
      employee: { connect: { id: dto.employeeId } },
      location: dto.locationId
        ? { connect: { id: dto.locationId } }
        : undefined,
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

    dto.shifts.forEach((shift) =>
      this.validateRange(shift.startAt, shift.endAt),
    );
    await this.ensureEntitiesExist(
      organisationId,
      dto.shifts.map((shift) => shift.employeeId),
      dto.shifts.map((shift) => shift.locationId).filter(Boolean) as string[],
      dto.shifts.map((shift) => shift.positionId).filter(Boolean) as string[],
    );
    await this.ensureNoOverlapBulk(organisationId, dto.shifts);

    const created = await Promise.all(
      dto.shifts.map((shift) =>
        this.scheduleRepository.createShift({
          organisation: { connect: { id: organisationId } },
          employee: { connect: { id: shift.employeeId } },
          location: shift.locationId
            ? { connect: { id: shift.locationId } }
            : undefined,
          period: shift.periodId
            ? { connect: { id: shift.periodId } }
            : undefined,
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

    return created;
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

  async validateSchedule(
    organisationId: string,
    actorId: string,
    dto: ValidateScheduleDto,
  ) {
    const period = await this.scheduleRepository.findPeriodById(
      organisationId,
      dto.periodId,
    );

    if (!period) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    const shifts =
      await this.scheduleRepository.findShiftsWithEmployeesByPeriod(
        organisationId,
        period.id,
      );

    const violationsByEmployee = new Map<
      string,
      {
        employeeId: string;
        employeeName: string | null;
        violations: Array<{
          ruleCode: string;
          severity: ScheduleValidationSeverity;
          message: string;
          dates: string[];
          meta?: Record<string, unknown>;
        }>;
      }
    >();

    const addViolation = (params: {
      employeeId: string;
      employeeName: string | null;
      ruleCode: string;
      severity: ScheduleValidationSeverity;
      message: string;
      dates: string[];
      meta?: Record<string, unknown>;
    }) => {
      const existing =
        violationsByEmployee.get(params.employeeId) ??
        ({
          employeeId: params.employeeId,
          employeeName: params.employeeName,
          violations: [],
        } as const);

      const updated = {
        employeeId: existing.employeeId,
        employeeName: existing.employeeName,
        violations: [
          ...existing.violations,
          {
            ruleCode: params.ruleCode,
            severity: params.severity,
            message: params.message,
            dates: params.dates,
            meta: params.meta,
          },
        ],
      };

      violationsByEmployee.set(params.employeeId, updated);
    };

    const shiftsByEmployee = new Map<
      string,
      {
        employeeName: string | null;
        shifts: Array<{
          id: string;
          startsAt: Date;
          endsAt: Date;
        }>;
      }
    >();

    shifts.forEach((shift) => {
      const employeeName = shift.employee
        ? `${shift.employee.firstName ?? ''} ${shift.employee.lastName ?? ''}`.trim() ||
          null
        : null;
      const entry = shiftsByEmployee.get(shift.employeeId) ?? {
        employeeName,
        shifts: [],
      };
      entry.shifts.push({
        id: shift.id,
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
      });
      shiftsByEmployee.set(shift.employeeId, entry);
    });

    shiftsByEmployee.forEach((payload, employeeId) => {
      payload.shifts.sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      );

      for (let i = 1; i < payload.shifts.length; i += 1) {
        const previous = payload.shifts[i - 1];
        const current = payload.shifts[i];

        if (current.startsAt < previous.endsAt) {
          addViolation({
            employeeId,
            employeeName: payload.employeeName,
            ruleCode: 'OVERLAP',
            severity: ScheduleValidationSeverity.ERROR,
            message: 'Nakładające się zmiany pracownika.',
            dates: [
              previous.startsAt.toISOString(),
              current.startsAt.toISOString(),
            ],
            meta: {
              previousShiftId: previous.id,
              currentShiftId: current.id,
              previousEndsAt: previous.endsAt.toISOString(),
              currentEndsAt: current.endsAt.toISOString(),
            },
          });
        }

        const restMs = current.startsAt.getTime() - previous.endsAt.getTime();
        const restHours = restMs / (1000 * 60 * 60);
        if (restHours < 11) {
          addViolation({
            employeeId,
            employeeName: payload.employeeName,
            ruleCode: 'DAILY_REST',
            severity: ScheduleValidationSeverity.WARNING,
            message: 'Odpoczynek dobowy krótszy niż 11 godzin.',
            dates: [current.startsAt.toISOString()],
            meta: {
              restHours: Number(restHours.toFixed(2)),
              previousShiftId: previous.id,
              currentShiftId: current.id,
            },
          });
        }
      }

      const startsByDay = new Map<string, string[]>();
      payload.shifts.forEach((shift) => {
        const dayKey = shift.startsAt.toISOString().slice(0, 10);
        const list = startsByDay.get(dayKey) ?? [];
        list.push(shift.id);
        startsByDay.set(dayKey, list);
      });

      startsByDay.forEach((shiftIds, dayKey) => {
        if (shiftIds.length > 1) {
          addViolation({
            employeeId,
            employeeName: payload.employeeName,
            ruleCode: 'MULTIPLE_STARTS',
            severity: ScheduleValidationSeverity.WARNING,
            message: 'Wiele rozpoczęć pracy w tym samym dniu.',
            dates: [dayKey],
            meta: {
              shiftIds,
              day: dayKey,
            },
          });
        }
      });

      const windows = this.buildWeeklyWindows(period.from, period.to);
      windows.forEach((window) => {
        const windowShifts = payload.shifts.filter(
          (shift) =>
            shift.startsAt < window.endsAt && shift.endsAt > window.startsAt,
        );

        const maxRest = this.computeMaxRestHours(
          window.startsAt,
          window.endsAt,
          windowShifts,
        );

        if (maxRest < 35) {
          addViolation({
            employeeId,
            employeeName: payload.employeeName,
            ruleCode: 'WEEKLY_REST',
            severity: ScheduleValidationSeverity.WARNING,
            message: 'Odpoczynek tygodniowy krótszy niż 35 godzin.',
            dates: [window.startsAt.toISOString(), window.endsAt.toISOString()],
            meta: {
              restHours: Number(maxRest.toFixed(2)),
              windowFrom: window.startsAt.toISOString(),
              windowTo: window.endsAt.toISOString(),
            },
          });
        }
      });
    });

    const persist = dto.persist !== false;
    if (persist) {
      await this.scheduleRepository.deleteValidationsForPeriod(
        organisationId,
        period.id,
      );

      const validationRows: Prisma.ScheduleValidationCreateManyInput[] = [];
      violationsByEmployee.forEach((payload) => {
        payload.violations.forEach((violation) => {
          validationRows.push({
            organisationId,
            periodId: period.id,
            employeeId: payload.employeeId,
            ruleCode: violation.ruleCode,
            severity: violation.severity,
            message: violation.message,
            metaJson: violation.meta ?? Prisma.JsonNull,
          });
        });
      });

      if (validationRows.length > 0) {
        await this.scheduleRepository.createValidations(validationRows);
      }
    }

    const employees = Array.from(violationsByEmployee.values());
    const summary = employees.reduce(
      (acc, employee) => {
        employee.violations.forEach((violation) => {
          if (violation.severity === ScheduleValidationSeverity.ERROR) {
            acc.errorCount += 1;
          } else {
            acc.warningCount += 1;
          }
        });
        return acc;
      },
      { errorCount: 0, warningCount: 0 },
    );

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'SchedulePeriod',
      entityId: period.id,
      action: 'SCHEDULE_VALIDATE',
      afterJson: {
        errorCount: summary.errorCount,
        warningCount: summary.warningCount,
        persisted: persist,
      } as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    return {
      periodId: period.id,
      summary,
      employees,
    };
  }

  async publishSchedule(
    organisationId: string,
    actorId: string,
    dto: PublishScheduleDto,
  ) {
    const period = await this.scheduleRepository.findPeriodById(
      organisationId,
      dto.periodId,
    );

    if (!period) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    if (period.status !== ScheduleStatus.APPROVED) {
      throw new ConflictException(
        this.buildError(
          'PERIOD_INVALID_TRANSITION',
          'Schedule period must be approved before publishing',
          {
            periodId: period.id,
            status: period.status,
          },
        ),
      );
    }

    const errorCount = await this.scheduleRepository.countValidationErrors(
      organisationId,
      period.id,
    );
    if (errorCount > 0) {
      throw new BadRequestException(
        this.buildError('VALIDATION_FAILED', 'Validation errors found', {
          errorCount,
        }),
      );
    }

    const updatedPeriod = await this.scheduleRepository.updatePeriodPublish(
      period.id,
      {
        status: ScheduleStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedBy: { connect: { id: actorId } },
        version: { increment: 1 },
      },
    );

    await this.scheduleRepository.updateShiftsStatusForPeriod(
      organisationId,
      period.id,
      ScheduleStatus.PUBLISHED,
      actorId,
    );

    const notify = dto.notify !== false;
    let notifiedCount = 0;
    if (notify) {
      const shifts =
        await this.scheduleRepository.findShiftsWithEmployeesByPeriod(
          organisationId,
          period.id,
        );

      const employeeUsers = new Map<
        string,
        { userId: string; name?: string }
      >();
      shifts.forEach((shift) => {
        if (shift.employee?.userId) {
          const name =
            `${shift.employee.firstName ?? ''} ${shift.employee.lastName ?? ''}`.trim();
          employeeUsers.set(shift.employee.userId, {
            userId: shift.employee.userId,
            name: name || undefined,
          });
        }
      });

      const dateRange = `${period.from.toLocaleDateString(
        'pl-PL',
      )} - ${period.to.toLocaleDateString('pl-PL')}`;

      for (const user of employeeUsers.values()) {
        const template = this.emailTemplatesService.schedulePublishedTemplate({
          employeeName: user.name,
          dateRange,
        });

        await this.notificationsService.createNotification({
          organisationId,
          userId: user.userId,
          type: NotificationType.SCHEDULE_PUBLISHED,
          title: 'Opublikowano grafik',
          body: `Nowy grafik został opublikowany na okres: ${dateRange}.`,
          data: {
            periodId: period.id,
            from: period.from.toISOString(),
            to: period.to.toISOString(),
          },
          emailSubject: template.subject,
          emailHtml: template.html,
        });
        notifiedCount += 1;
      }
    }

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'SchedulePeriod',
      entityId: period.id,
      action: 'SCHEDULE_PUBLISH',
      afterJson: {
        periodId: period.id,
        version: updatedPeriod.version,
        notifiedCount,
        comment: dto.comment ?? null,
      } as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    await this.auditService.record({
      organisationId,
      actorUserId: actorId,
      action: AUDIT_ACTIONS.GRAFIK_PUBLISH,
      entityType: 'schedule_period',
      entityId: period.id,
      after: {
        periodId: period.id,
        status: ScheduleStatus.PUBLISHED,
        version: updatedPeriod.version,
        notifiedCount,
      },
    });

    return {
      periodId: period.id,
      version: updatedPeriod.version,
      notifiedCount,
      publishedAt: updatedPeriod.publishedAt,
    };
  }

  async approveSchedule(
    organisationId: string,
    actorId: string,
    periodId: string,
  ) {
    const period = await this.scheduleRepository.findPeriodById(
      organisationId,
      periodId,
    );

    if (!period) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    if (period.status !== ScheduleStatus.DRAFT) {
      throw new ConflictException(
        this.buildError(
          'PERIOD_INVALID_TRANSITION',
          'Schedule period must be draft to approve',
          {
            periodId: period.id,
            status: period.status,
          },
        ),
      );
    }

    const updatedPeriod = await this.scheduleRepository.updatePeriodPublish(
      period.id,
      {
        status: ScheduleStatus.APPROVED,
        publishedAt: null,
        publishedBy: { disconnect: true },
        version: { increment: 1 },
      },
    );

    await this.scheduleRepository.updateShiftsStatusForPeriod(
      organisationId,
      period.id,
      ScheduleStatus.APPROVED,
      actorId,
    );

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'SchedulePeriod',
      entityId: period.id,
      action: 'SCHEDULE_APPROVE',
      afterJson: {
        periodId: period.id,
        status: ScheduleStatus.APPROVED,
        version: updatedPeriod.version,
      } as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    return {
      periodId: period.id,
      status: ScheduleStatus.APPROVED,
      version: updatedPeriod.version,
    };
  }

  async unpublishSchedule(
    organisationId: string,
    actorId: string,
    periodId: string,
  ) {
    const period = await this.scheduleRepository.findPeriodById(
      organisationId,
      periodId,
    );

    if (!period) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    if (period.status !== ScheduleStatus.PUBLISHED) {
      throw new ConflictException(
        this.buildError(
          'PERIOD_INVALID_TRANSITION',
          'Schedule period must be published to unpublish',
          {
            periodId: period.id,
            status: period.status,
          },
        ),
      );
    }

    const updatedPeriod = await this.scheduleRepository.updatePeriodPublish(
      period.id,
      {
        status: ScheduleStatus.APPROVED,
        publishedAt: null,
        publishedBy: { disconnect: true },
        version: { increment: 1 },
      },
    );

    await this.scheduleRepository.updateShiftsStatusForPeriod(
      organisationId,
      period.id,
      ScheduleStatus.APPROVED,
      actorId,
    );

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'SchedulePeriod',
      entityId: period.id,
      action: 'SCHEDULE_UNPUBLISH',
      afterJson: {
        periodId: period.id,
        status: ScheduleStatus.APPROVED,
        version: updatedPeriod.version,
      } as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    await this.auditService.record({
      organisationId,
      actorUserId: actorId,
      action: AUDIT_ACTIONS.GRAFIK_UNPUBLISH,
      entityType: 'schedule_period',
      entityId: period.id,
      after: {
        periodId: period.id,
        status: ScheduleStatus.APPROVED,
        version: updatedPeriod.version,
      },
    });

    return {
      periodId: period.id,
      status: ScheduleStatus.APPROVED,
      version: updatedPeriod.version,
    };
  }

  async duplicatePreviousPeriod(
    organisationId: string,
    actorId: string,
    dto: DuplicatePreviousPeriodDto,
  ) {
    const period = await this.scheduleRepository.findPeriodById(
      organisationId,
      dto.periodId,
    );

    if (!period) {
      throw new NotFoundException(
        this.buildError('PERIOD_NOT_FOUND', 'Schedule period not found'),
      );
    }

    if (period.status === ScheduleStatus.PUBLISHED) {
      throw new ConflictException(
        this.buildError(
          'PERIOD_READONLY',
          'Grafik opublikowany — odblokuj, aby edytować',
          {
            periodId: period.id,
          },
        ),
      );
    }

    const durationMs = period.to.getTime() - period.from.getTime();
    const previousPeriods = await this.scheduleRepository.findPreviousPeriods(
      organisationId,
      period.locationId,
      period.from,
    );

    const sourcePeriod = previousPeriods.find(
      (candidate) =>
        candidate.to.getTime() - candidate.from.getTime() === durationMs,
    );

    if (!sourcePeriod) {
      throw new NotFoundException(
        this.buildError(
          'PREVIOUS_PERIOD_NOT_FOUND',
          'Previous period not found',
        ),
      );
    }

    const sourceShifts = await this.scheduleRepository.findShiftsByPeriod(
      organisationId,
      sourcePeriod.id,
    );

    const offsetMs = period.from.getTime() - sourcePeriod.from.getTime();

    const cleared = await this.scheduleRepository.deleteShiftsByPeriod(
      organisationId,
      period.id,
    );

    if (sourceShifts.length > 0) {
      const payload: Prisma.ShiftCreateManyInput[] = sourceShifts.map(
        (shift) => ({
          organisationId,
          periodId: period.id,
          employeeId: shift.employeeId,
          locationId: shift.locationId,
          positionId: shift.positionId,
          position: shift.position,
          notes: shift.notes,
          note: shift.note,
          availabilityOverrideReason: shift.availabilityOverrideReason,
          color: shift.color,
          startsAt: new Date(shift.startsAt.getTime() + offsetMs),
          endsAt: new Date(shift.endsAt.getTime() + offsetMs),
          status: ScheduleStatus.DRAFT,
          createdById: actorId,
          updatedById: actorId,
        }),
      );

      await this.scheduleRepository.createShifts(payload);
    }

    await this.scheduleRepository.createAudit({
      organisation: { connect: { id: organisationId } },
      entityType: 'SchedulePeriod',
      entityId: period.id,
      action: 'SCHEDULE_DUPLICATE_PREVIOUS',
      afterJson: {
        sourcePeriodId: sourcePeriod.id,
        clearedCount: cleared.count,
        createdCount: sourceShifts.length,
      } as Prisma.JsonObject,
      actor: { connect: { id: actorId } },
    });

    return {
      periodId: period.id,
      sourcePeriodId: sourcePeriod.id,
      clearedCount: cleared.count,
      createdCount: sourceShifts.length,
    };
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

  private async ensureNoOverlap(
    organisationId: string,
    employeeId: string,
    startAt: string,
    endAt: string,
  ) {
    const overlap = await this.scheduleRepository.findOverlappingShift(
      organisationId,
      employeeId,
      new Date(startAt),
      new Date(endAt),
    );
    if (overlap) {
      throw new ConflictException(
        this.buildError('SHIFT_OVERLAP', 'Shift overlaps existing shift', {
          overlapId: overlap.id,
          overlapStartsAt: overlap.startsAt,
          overlapEndsAt: overlap.endsAt,
        }),
      );
    }
  }

  private async ensureNoOverlapBulk(
    organisationId: string,
    shifts: CreateScheduleShiftDto[],
  ) {
    for (const shift of shifts) {
      await this.ensureNoOverlap(
        organisationId,
        shift.employeeId,
        shift.startAt,
        shift.endAt,
      );
    }
  }

  private async ensureEditablePeriods(
    organisationId: string,
    ...periodIds: string[]
  ) {
    const filteredIds = periodIds.filter(
      (periodId): periodId is string => Boolean(periodId),
    );
    if (filteredIds.length === 0) return;
    const uniqueIds = Array.from(new Set(filteredIds));
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
      throw new ConflictException(
        this.buildError(
          'PERIOD_READONLY',
          'Grafik opublikowany — odblokuj, aby edytować',
          {
            periodId: published.id,
          },
        ),
      );
    }
  }

  private async findOrCreatePeriod(
    organisationId: string,
    locationId: string,
    from: Date,
    to: string,
  ) {
    const toDate = new Date(to);
    if (Number.isNaN(toDate.valueOf())) return null;
    const existing = await this.scheduleRepository.findPeriodByRange(
      organisationId,
      locationId,
      from,
      toDate,
    );
    if (existing) return existing;

    return this.scheduleRepository.createPeriod({
      organisation: { connect: { id: organisationId } },
      location: { connect: { id: locationId } },
      from,
      to: toDate,
      status: ScheduleStatus.DRAFT,
      version: 1,
    });
  }

  private buildWeeklyWindows(from: Date, to: Date) {
    const windows: Array<{ startsAt: Date; endsAt: Date }> = [];
    let cursor = new Date(from);
    while (cursor < to) {
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor);
      endsAt.setDate(endsAt.getDate() + 7);
      if (endsAt > to) {
        endsAt.setTime(to.getTime());
      }
      windows.push({ startsAt, endsAt });
      cursor = new Date(startsAt);
      cursor.setDate(cursor.getDate() + 7);
    }
    return windows;
  }

  private computeMaxRestHours(
    windowStart: Date,
    windowEnd: Date,
    shifts: Array<{ startsAt: Date; endsAt: Date }>,
  ) {
    if (shifts.length === 0) {
      return (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60);
    }

    const sorted = shifts
      .slice()
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

    let maxRest = 0;
    let cursor = windowStart.getTime();

    sorted.forEach((shift) => {
      const start = Math.max(shift.startsAt.getTime(), windowStart.getTime());
      const end = Math.min(shift.endsAt.getTime(), windowEnd.getTime());
      if (start > cursor) {
        maxRest = Math.max(maxRest, start - cursor);
      }
      if (end > cursor) {
        cursor = end;
      }
    });

    if (windowEnd.getTime() > cursor) {
      maxRest = Math.max(maxRest, windowEnd.getTime() - cursor);
    }

    return maxRest / (1000 * 60 * 60);
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
