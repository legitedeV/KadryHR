import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityStatus,
  LeaveStatus,
  NotificationType,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../auth/permissions.service';
import { Permission } from '../auth/permissions';
import { QueryShiftsDto } from './dto/query-shifts.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private async userCanManageSchedule(
    organisationId: string,
    userId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: { role: true },
    });

    if (!user) return false;
    const permissions =
      await this.permissionsService.getOrganisationPermissions(
        organisationId,
        user.role,
      );
    return (
      permissions.includes(Permission.SCHEDULE_MANAGE) ||
      permissions.includes(Permission.RCP_EDIT)
    );
  }

  /**
   * Wszystkie zmiany w organizacji (dla OWNER/MANAGER).
   */
  findAll(organisationId: string, query: QueryShiftsDto) {
    return this.prisma.shift.findMany({
      where: this.buildWhere(organisationId, query),
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
    query: QueryShiftsDto,
    options: { employeeId: string },
  ) {
    return this.prisma.shift.findMany({
      where: this.buildWhere(organisationId, {
        ...query,
        employeeId: options.employeeId,
      }),
      orderBy: { startsAt: 'asc' },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  /**
   * Tworzenie zmiany.
   */
  async create(organisationId: string, dto: any) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (!(startsAt.getTime() < endsAt.getTime())) {
      throw new BadRequestException('Shift start must be before end');
    }

    await this.ensureEmployee(organisationId, dto.employeeId);
    if (dto.locationId) {
      await this.ensureLocation(organisationId, dto.locationId);
    }

    const leaveWarning = await this.ensureNoConflict(
      organisationId,
      dto.employeeId,
      startsAt,
      endsAt,
    );

    const availabilityWarning = await this.computeAvailabilityWarning(
      organisationId,
      dto.employeeId,
      startsAt,
      endsAt,
    );

    const created = await this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId ?? null,
        position: dto.position ?? null,
        notes: dto.notes ?? null,
        availabilityOverrideReason: dto.availabilityOverrideReason ?? null,
        color: dto.color ?? null,
        startsAt,
        endsAt,
      },
      include: {
        employee: {
          select: { userId: true, firstName: true, lastName: true },
        },
      },
    });

    // Notify employee about new shift assignment
    await this.notifyShiftAssignment(
      organisationId,
      created.employee?.userId,
      created,
      'assigned',
    );

    return { ...created, availabilityWarning, leaveWarning };
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

    const nextEmployeeId = dto.employeeId ?? existing.employeeId;
    const nextLocationId =
      dto.locationId !== undefined ? dto.locationId : existing.locationId;
    const nextStartsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : existing.startsAt;
    const nextEndsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    const nextColor = dto.color !== undefined ? dto.color : existing.color;

    if (!(nextStartsAt.getTime() < nextEndsAt.getTime())) {
      throw new BadRequestException('Shift start must be before end');
    }

    await this.ensureEmployee(organisationId, nextEmployeeId);
    if (nextLocationId) {
      await this.ensureLocation(organisationId, nextLocationId);
    }
    const leaveWarning = await this.ensureNoConflict(
      organisationId,
      nextEmployeeId,
      nextStartsAt,
      nextEndsAt,
      id,
    );

    const availabilityWarning = await this.computeAvailabilityWarning(
      organisationId,
      nextEmployeeId,
      nextStartsAt,
      nextEndsAt,
    );

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        employeeId: nextEmployeeId,
        locationId: nextLocationId,
        position: dto.position ?? existing.position,
        notes: dto.notes ?? existing.notes,
        availabilityOverrideReason:
          dto.availabilityOverrideReason ?? existing.availabilityOverrideReason,
        color: nextColor,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
      },
      include: {
        employee: {
          select: { userId: true, firstName: true, lastName: true },
        },
      },
    });

    // Notify if employee changed or time changed significantly
    const employeeChanged = nextEmployeeId !== existing.employeeId;
    const timeChanged =
      nextStartsAt.getTime() !== existing.startsAt.getTime() ||
      nextEndsAt.getTime() !== existing.endsAt.getTime();

    if (employeeChanged || timeChanged) {
      await this.notifyShiftAssignment(
        organisationId,
        updated.employee?.userId,
        updated,
        'updated',
      );
    }

    return { ...updated, availabilityWarning, leaveWarning };
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
    const where = this.buildWhere(organisationId, query);
    const shifts = await this.prisma.shift.findMany({
      where,
      select: {
        employeeId: true,
        startsAt: true,
        endsAt: true,
      },
    });

    const employeeIds = Array.from(
      new Set(
        shifts
          .map((shift) => shift.employeeId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const employees = employeeIds.length
      ? await this.prisma.employee.findMany({
          where: { organisationId, id: { in: employeeIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];

    const nameMap = new Map(
      employees.map((emp) => [
        emp.id,
        `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() ||
          emp.email ||
          'Pracownik',
      ]),
    );

    const totals = new Map<
      string,
      { employeeId: string; employeeName: string; hours: number }
    >();

    for (const shift of shifts) {
      if (!shift.employeeId) continue;
      const current = totals.get(shift.employeeId) ?? {
        employeeId: shift.employeeId,
        employeeName: nameMap.get(shift.employeeId) ?? 'Pracownik',
        hours: 0,
      };

      const diff =
        (new Date(shift.endsAt).getTime() -
          new Date(shift.startsAt).getTime()) /
        (1000 * 60 * 60);
      current.hours += Math.max(diff, 0);
      totals.set(shift.employeeId, current);
    }

    return Array.from(totals.values()).map((item) => ({
      ...item,
      hours: Math.round((item.hours + Number.EPSILON) * 100) / 100,
    }));
  }

  private buildWhere(
    organisationId: string,
    query: QueryShiftsDto,
  ): Prisma.ShiftWhereInput {
    const where: Prisma.ShiftWhereInput = {
      organisationId,
    };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }
    if (query.locationId) {
      where.locationId = query.locationId;
    }
    if (query.from) {
      where.endsAt = { gte: new Date(query.from) };
    }
    if (query.to) {
      where.startsAt = { lte: new Date(query.to) };
    }

    return where;
  }

  private async ensureEmployee(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (employee.isDeleted) {
      throw new BadRequestException('Pracownik został usunięty.');
    }
    if (!employee.isActive) {
      throw new BadRequestException('Pracownik jest nieaktywny.');
    }
    return employee;
  }

  private async ensureLocation(organisationId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  /**
   * Checks for shift and leave conflicts for an employee.
   *
   * @returns null if no leave conflict, or a warning message if there's an
   *          approved leave but the organisation allows shifts during leave.
   * @throws BadRequestException if:
   *         - Employee already has a shift in the time range
   *         - Employee has approved leave AND organisation prevents shifts during leave
   */
  private async ensureNoConflict(
    organisationId: string,
    employeeId: string,
    startsAt: Date,
    endsAt: Date,
    ignoreShiftId?: string,
  ): Promise<string | null> {
    const conflict = await this.prisma.shift.findFirst({
      where: {
        organisationId,
        employeeId,
        id: ignoreShiftId ? { not: ignoreShiftId } : undefined,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (conflict) {
      throw new BadRequestException('Pracownik ma już zmianę w tym czasie.');
    }

    const org = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { preventShiftOnApprovedLeave: true },
    });

    // Check for approved leave conflicts
    const leaveConflict = await this.prisma.leaveRequest.findFirst({
      where: {
        organisationId,
        employeeId,
        status: LeaveStatus.APPROVED,
        AND: [{ startDate: { lte: endsAt } }, { endDate: { gte: startsAt } }],
      },
      include: { leaveType: true },
    });

    if (leaveConflict) {
      const leaveTypeName = leaveConflict.leaveType?.name ?? 'Urlop';
      if (org?.preventShiftOnApprovedLeave) {
        throw new BadRequestException(
          `Pracownik ma zatwierdzony urlop (${leaveTypeName}) w tym terminie. Nie można dodać zmiany.`,
        );
      }
      // Return a warning if the flag is false
      return `Pracownik ma zatwierdzony urlop (${leaveTypeName}) w tym terminie.`;
    }

    return null;
  }

  private async computeAvailabilityWarning(
    organisationId: string,
    employeeId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const availability = await this.prisma.availability.findMany({
      where: { organisationId, employeeId },
    });

    if (!availability.length) {
      return null;
    }

    const shiftDateIso = startsAt.toISOString().slice(0, 10);
    const shiftWeekday = startsAt.getUTCDay(); // 0-6
    const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
    const endMinutes = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();

    const weekdayMap: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    const matching = availability.filter((slot) => {
      if (slot.date) {
        return slot.date.toISOString().slice(0, 10) === shiftDateIso;
      }
      if (slot.weekday) {
        return slot.weekday === weekdayMap[shiftWeekday];
      }
      return false;
    });

    if (!matching.length) {
      return null;
    }

    const hasDayOff = matching.some(
      (slot) => slot.status === AvailabilityStatus.DAY_OFF,
    );
    if (hasDayOff) {
      return 'Pracownik ma oznaczony dzień wolny.';
    }

    const covered = matching
      .filter((slot) => slot.status !== AvailabilityStatus.DAY_OFF)
      .some(
        (slot) =>
          slot.startMinutes <= startMinutes && slot.endMinutes >= endMinutes,
      );

    if (!covered) {
      return 'Godziny zmiany wykraczają poza dostępność pracownika.';
    }

    return null;
  }

  /**
   * Notify employee about shift assignment/update
   */
  private async notifyShiftAssignment(
    organisationId: string,
    userId: string | null | undefined,
    shift: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      position?: string | null;
      employee?: {
        firstName: string | null;
        lastName: string | null;
      } | null;
    },
    action: 'assigned' | 'updated',
  ) {
    if (!userId) {
      return; // Employee doesn't have a user account
    }
    const canManage = await this.userCanManageSchedule(organisationId, userId);
    if (!canManage) {
      return;
    }

    const actionLabel = action === 'assigned' ? 'przypisana' : 'zaktualizowana';
    const dateStr = shift.startsAt.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = `${shift.startsAt.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${shift.endsAt.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const title = `Zmiana ${actionLabel}`;
    const body = shift.position
      ? `Zmiana (${shift.position}) w dniu ${dateStr}, godz. ${timeStr}`
      : `Zmiana w dniu ${dateStr}, godz. ${timeStr}`;

    await this.notificationsService.createNotification({
      organisationId,
      userId,
      type: NotificationType.SHIFT_ASSIGNMENT,
      title,
      body,
      data: {
        shiftId: shift.id,
        action,
        startsAt: shift.startsAt.toISOString(),
        endsAt: shift.endsAt.toISOString(),
      },
      emailSubject: title,
    });
  }

  /**
   * Notify multiple employees about schedule publication (bulk shifts)
   */
  async notifySchedulePublished(
    organisationId: string,
    employeeIds: string[],
    dateRange?: { from: Date; to: Date },
  ) {
    // Get user IDs for the employees
    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        organisationId,
        userId: { not: null },
        isActive: true,
        isDeleted: false,
      },
      select: {
        userId: true,
      },
    });

    const userIds = employees
      .map((e) => e.userId)
      .filter((uid): uid is string => uid !== null);

    if (userIds.length === 0) {
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, organisationId },
      select: { id: true, role: true },
    });

    const roles = Array.from(new Set(users.map((user) => user.role)));
    const permissionsByRole = new Map<string, Permission[]>();
    await Promise.all(
      roles.map(async (role) => {
        const permissions =
          await this.permissionsService.getOrganisationPermissions(
            organisationId,
            role,
          );
        permissionsByRole.set(role, permissions);
      }),
    );

    const scheduleManagers = users
      .filter((user) => {
        const permissions = permissionsByRole.get(user.role) ?? [];
        return (
          permissions.includes(Permission.SCHEDULE_MANAGE) ||
          permissions.includes(Permission.RCP_EDIT)
        );
      })
      .map((user) => user.id);

    if (scheduleManagers.length === 0) {
      return;
    }

    const dateRangeStr = dateRange
      ? `${dateRange.from.toLocaleDateString('pl-PL')} - ${dateRange.to.toLocaleDateString('pl-PL')}`
      : 'najbliższy okres';

    // Send notification to each employee
    for (const userId of scheduleManagers) {
      await this.notificationsService.createNotification({
        organisationId,
        userId,
        type: NotificationType.SCHEDULE_PUBLISHED,
        title: 'Opublikowano grafik',
        body: `Nowy grafik został opublikowany na okres: ${dateRangeStr}. Sprawdź swoje zmiany.`,
        data: {
          dateRange: dateRange
            ? {
                from: dateRange.from.toISOString(),
                to: dateRange.to.toISOString(),
              }
            : null,
        },
        emailSubject: 'Opublikowano nowy grafik',
      });
    }
  }

  /**
   * Clear all shifts for a given week (date range)
   * Optionally filter by location
   */
  async clearWeek(
    organisationId: string,
    dateRange: { from: Date; to: Date },
    locationId?: string,
  ): Promise<{ deletedCount: number }> {
    const where: any = {
      organisationId,
      startsAt: { gte: dateRange.from },
      endsAt: { lte: dateRange.to },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const result = await this.prisma.shift.deleteMany({
      where,
    });

    return { deletedCount: result.count };
  }

  /**
   * Build shift payloads from the previous week so the frontend can create them
   * using the standard shift creation endpoint.
   */
  async buildCopyFromPreviousWeek(
    organisationId: string,
    dateRange: { from: Date; to: Date },
    locationId?: string,
  ) {
    const previousFrom = new Date(dateRange.from);
    previousFrom.setDate(previousFrom.getDate() - 7);
    const previousTo = new Date(dateRange.to);
    previousTo.setDate(previousTo.getDate() - 7);

    const where: Prisma.ShiftWhereInput = {
      organisationId,
      startsAt: { gte: previousFrom },
      endsAt: { lte: previousTo },
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const shifts = await this.prisma.shift.findMany({
      where,
      orderBy: { startsAt: 'asc' },
    });

    return shifts.map((shift) => {
      const newStart = new Date(shift.startsAt);
      newStart.setDate(newStart.getDate() + 7);
      const newEnd = new Date(shift.endsAt);
      newEnd.setDate(newEnd.getDate() + 7);

      return {
        employeeId: shift.employeeId,
        locationId: shift.locationId ?? undefined,
        position: shift.position ?? undefined,
        notes: shift.notes ?? undefined,
        color: shift.color ?? undefined,
        startsAt: newStart.toISOString(),
        endsAt: newEnd.toISOString(),
      };
    });
  }
}
