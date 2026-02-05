import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AvailabilityStatus,
  AvailabilitySubmissionStatus,
  NotificationType,
  Prisma,
  Role,
  Weekday,
} from '@prisma/client';
import { EmployeesService } from '../employees/employees.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface EmployeeAvailabilitySummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  locations: Array<{ id: string; name: string }>;
  availabilityCount: number;
  hasWeeklyDefault: boolean;
  submissionStatus?: AvailabilitySubmissionStatus;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
}

export interface TeamAvailabilityQuery {
  search?: string;
  locationId?: string;
  role?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Validate time intervals for overlaps
   */
  private validateIntervals(
    intervals: Array<{
      startMinutes: number;
      endMinutes: number;
      weekday?: string;
      date?: string;
      status?: AvailabilityStatus;
    }>,
  ) {
    // Group by weekday or date
    const grouped: Record<string, Array<{ start: number; end: number }>> = {};
    const dayOffKeys = new Set<string>();

    for (const interval of intervals) {
      const key = interval.weekday || interval.date || 'default';
      if (interval.status === AvailabilityStatus.DAY_OFF) {
        dayOffKeys.add(key);
        continue;
      }
      if (interval.endMinutes <= interval.startMinutes) {
        throw new BadRequestException(
          'Godzina końcowa musi być po godzinie początkowej',
        );
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push({
        start: interval.startMinutes,
        end: interval.endMinutes,
      });
    }

    // Check for overlaps within each day
    for (const [key, slots] of Object.entries(grouped)) {
      if (dayOffKeys.has(key)) {
        throw new BadRequestException(
          'Nie można łączyć "Dzień wolny" z przedziałami czasowymi',
        );
      }
      const sorted = [...slots].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start < sorted[i - 1].end) {
          throw new BadRequestException(
            `Przedziały czasowe nakładają się (${key})`,
          );
        }
      }
    }
  }

  private ensureDateWithinWindow(
    date: Date,
    window: { startDate: Date; endDate: Date },
  ) {
    const start = new Date(window.startDate);
    const end = new Date(window.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (date < start || date > end) {
      throw new BadRequestException('Podana data jest poza zakresem okna');
    }
  }

  private ensureWindowOpen(window: {
    isOpen: boolean;
    deadline: Date;
    closedAt?: Date | null;
  }) {
    const now = new Date();
    if (!window.isOpen || window.deadline < now || window.closedAt) {
      throw new BadRequestException('Okno składania dyspozycji jest zamknięte');
    }
  }

  private async ensureNoActiveWindow(
    organisationId: string,
    deadline: Date,
    excludeId?: string,
  ) {
    const now = new Date();
    if (deadline < now) {
      return;
    }

    const existing = await this.prisma.availabilityWindow.count({
      where: {
        organisationId,
        isOpen: true,
        closedAt: null,
        deadline: { gte: now },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existing > 0) {
      throw new BadRequestException(
        'Istnieje już aktywne okno dyspozycji dla tej organizacji.',
      );
    }
  }

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
          },
        },
      },
    });
  }

  /**
   * Find employee by user ID
   */
  async findEmployeeByUserId(organisationId: string, userId: string) {
    const employee = await this.employeesService.ensureEmployeeProfile(
      organisationId,
      userId,
    );
    this.ensureEmployeeActive(employee);
    return employee;
  }

  private ensureEmployeeActive(employee: {
    isActive: boolean;
    isDeleted: boolean;
  }) {
    if (employee.isDeleted) {
      throw new BadRequestException('Pracownik został usunięty.');
    }
    if (!employee.isActive) {
      throw new BadRequestException('Pracownik jest nieaktywny.');
    }
  }

  private async ensureEmployeeActiveById(
    organisationId: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      select: { id: true, isActive: true, isDeleted: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    this.ensureEmployeeActive(employee);
  }

  /**
   * Tworzenie rekordu dostępności.
   */
  async create(organisationId: string, dto: any) {
    await this.ensureEmployeeActiveById(organisationId, dto.employeeId);
    const status = dto.status ?? AvailabilityStatus.AVAILABLE;
    const startMinutes =
      status === AvailabilityStatus.DAY_OFF ? 0 : dto.startMinutes;
    const endMinutes =
      status === AvailabilityStatus.DAY_OFF ? 0 : dto.endMinutes;
    if (status !== AvailabilityStatus.DAY_OFF && endMinutes <= startMinutes) {
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
        startMinutes,
        endMinutes,
        status,
        notes: dto.notes ?? null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    const targetEmployeeId = dto.employeeId ?? existing.employeeId;
    await this.ensureEmployeeActiveById(organisationId, targetEmployeeId);

    const status =
      dto.status ?? existing.status ?? AvailabilityStatus.AVAILABLE;
    const startMinutes =
      typeof dto.startMinutes === 'number'
        ? dto.startMinutes
        : existing.startMinutes;
    const endMinutes =
      typeof dto.endMinutes === 'number' ? dto.endMinutes : existing.endMinutes;
    const nextStart = status === AvailabilityStatus.DAY_OFF ? 0 : startMinutes;
    const nextEnd = status === AvailabilityStatus.DAY_OFF ? 0 : endMinutes;
    if (status !== AvailabilityStatus.DAY_OFF && nextEnd <= nextStart) {
      throw new BadRequestException(
        'endMinutes must be greater than startMinutes',
      );
    }

    return this.prisma.availability.update({
      where: { id },
      data: {
        employeeId: targetEmployeeId,
        date: dto.date ?? existing.date,
        weekday: dto.weekday ?? existing.weekday,
        startMinutes: nextStart,
        endMinutes: nextEnd,
        status,
        notes: dto.notes ?? existing.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      status?: AvailabilityStatus;
      notes?: string;
    }>,
  ) {
    await this.ensureEmployeeActiveById(organisationId, employeeId);
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
          availabilityWindowId: null,
        },
      });
    }

    // Create new availability records
    const created = await this.prisma.$transaction(
      availabilities.map((avail) => {
        const status = avail.status ?? AvailabilityStatus.AVAILABLE;
        const startMinutes =
          status === AvailabilityStatus.DAY_OFF ? 0 : avail.startMinutes;
        const endMinutes =
          status === AvailabilityStatus.DAY_OFF ? 0 : avail.endMinutes;
        if (
          status !== AvailabilityStatus.DAY_OFF &&
          endMinutes <= startMinutes
        ) {
          throw new BadRequestException(
            'endMinutes must be greater than startMinutes',
          );
        }
        return this.prisma.availability.create({
          data: {
            organisationId,
            employeeId,
            availabilityWindowId: null,
            date: avail.date ?? null,
            weekday: (avail.weekday as Weekday) ?? null,
            startMinutes,
            endMinutes,
            status,
            notes: avail.notes ?? null,
          },
        });
      }),
    );

    return created;
  }

  // ==========================================
  // AVAILABILITY WINDOWS (Task 1)
  // ==========================================

  /**
   * Get all availability windows for an organisation
   */
  async findAllWindows(organisationId: string) {
    return this.prisma.availabilityWindow.findMany({
      where: { organisationId },
      orderBy: { deadline: 'desc' },
    });
  }

  /**
   * Get current and future availability windows (open ones that haven't passed deadline)
   */
  async findActiveWindows(organisationId: string) {
    const now = new Date();
    return this.prisma.availabilityWindow.findMany({
      where: {
        organisationId,
        isOpen: true,
        closedAt: null,
        deadline: { gte: now },
      },
      orderBy: { deadline: 'asc' },
    });
  }

  /**
   * Get a specific availability window
   */
  async findWindowById(organisationId: string, windowId: string) {
    const window = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, organisationId },
    });

    if (!window) {
      throw new NotFoundException('Availability window not found');
    }

    return window;
  }

  /**
   * Create a new availability window
   */
  async createWindow(
    organisationId: string,
    dto: {
      title?: string;
      startDate: string;
      endDate: string;
      deadline: string;
      isOpen?: boolean;
    },
  ) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const deadline = new Date(dto.deadline);
    const isOpen = dto.isOpen ?? true;

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    if (isOpen) {
      await this.ensureNoActiveWindow(organisationId, deadline);
    }

    return this.prisma.availabilityWindow.create({
      data: {
        organisationId,
        title: dto.title ?? 'Składanie dyspozycji',
        startDate,
        endDate,
        deadline,
        isOpen,
        closedAt: null,
      },
    });
  }

  /**
   * Update an availability window
   */
  async updateWindow(
    organisationId: string,
    windowId: string,
    dto: {
      title?: string;
      startDate?: string;
      endDate?: string;
      deadline?: string;
      isOpen?: boolean;
    },
  ) {
    const existing = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability window not found');
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    const deadline = dto.deadline ? new Date(dto.deadline) : existing.deadline;
    const isOpen = dto.isOpen ?? existing.isOpen;

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    if (isOpen) {
      await this.ensureNoActiveWindow(organisationId, deadline, windowId);
    }

    const now = new Date();
    const shouldClose = existing.isOpen && dto.isOpen === false;
    const shouldReopen = !existing.isOpen && dto.isOpen === true;
    const closedAt = shouldReopen
      ? null
      : shouldClose
        ? now
        : (existing.closedAt ?? null);
    const effectiveDeadline = shouldClose && deadline > now ? now : deadline;

    return this.prisma.availabilityWindow.update({
      where: { id: windowId },
      data: {
        title: dto.title ?? existing.title,
        startDate,
        endDate,
        deadline: effectiveDeadline,
        isOpen,
        closedAt,
      },
    });
  }

  /**
   * Close an availability window manually
   */
  async closeWindow(
    organisationId: string,
    windowId: string,
    actorUserId: string,
  ) {
    const window = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, organisationId },
    });

    if (!window) {
      throw new NotFoundException('Availability window not found');
    }

    const now = new Date();
    if (!window.isOpen || window.deadline < now || window.closedAt) {
      throw new BadRequestException('To okno dyspozycji jest już zamknięte.');
    }

    const updated = await this.prisma.availabilityWindow.update({
      where: { id: windowId },
      data: {
        isOpen: false,
        closedAt: now,
        deadline: window.deadline > now ? now : window.deadline,
      },
    });

    const employees = await this.prisma.user.findMany({
      where: {
        organisationId,
        role: Role.EMPLOYEE,
      },
    });

    await Promise.all(
      employees.map((employee) =>
        this.notificationsService.createNotification({
          organisationId,
          userId: employee.id,
          type: NotificationType.AVAILABILITY_WINDOW_CLOSED,
          title: 'Okno dyspozycji zamknięte',
          body: `Okno "${updated.title}" zostało zamknięte. Nie można już składać nowych dyspozycji.`,
          data: {
            windowId: updated.id,
          },
        }),
      ),
    );

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'availability.window.closed',
      entityType: 'availability_window',
      entityId: updated.id,
      before: {
        isOpen: window.isOpen,
        deadline: window.deadline,
        closedAt: window.closedAt,
      },
      after: {
        isOpen: updated.isOpen,
        deadline: updated.deadline,
        closedAt: updated.closedAt,
      },
    });

    return updated;
  }

  /**
   * Delete an availability window
   */
  async deleteWindow(organisationId: string, windowId: string) {
    const existing = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability window not found');
    }

    await this.prisma.availabilityWindow.delete({
      where: { id: windowId },
    });

    return { success: true };
  }

  // ==========================================
  // CURRENT USER AVAILABILITY (GET /availability/me)
  // ==========================================

  /**
   * Get current user's availability
   */
  async getMyAvailability(organisationId: string, userId: string) {
    const employee = await this.findEmployeeByUserId(organisationId, userId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const availability = await this.prisma.availability.findMany({
      where: {
        organisationId,
        employeeId: employee.id,
        availabilityWindowId: null,
      },
      orderBy: [{ weekday: 'asc' }, { date: 'asc' }, { startMinutes: 'asc' }],
    });

    return {
      employeeId: employee.id,
      availability,
    };
  }

  /**
   * Update current user's availability (default weekly pattern)
   */
  async updateMyAvailability(
    organisationId: string,
    userId: string,
    availabilities: Array<{
      weekday?: string;
      date?: string;
      startMinutes: number;
      endMinutes: number;
      status?: AvailabilityStatus;
      notes?: string;
    }>,
  ) {
    const employee = await this.findEmployeeByUserId(organisationId, userId);
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Validate intervals before saving
    this.validateIntervals(availabilities);

    return this.bulkUpsertForEmployee(
      organisationId,
      employee.id,
      availabilities,
    );
  }

  // ==========================================
  // AVAILABILITY WINDOW SUBMISSIONS
  // ==========================================

  async getWindowAvailabilityForEmployee(
    organisationId: string,
    userId: string,
    windowId: string,
  ) {
    const window = await this.findWindowById(organisationId, windowId);
    const employee = await this.findEmployeeByUserId(organisationId, userId);

    const [submission, availability] = await Promise.all([
      this.prisma.availabilitySubmission.findUnique({
        where: {
          windowId_employeeId: { windowId, employeeId: employee.id },
        },
      }),
      this.prisma.availability.findMany({
        where: {
          organisationId,
          employeeId: employee.id,
          availabilityWindowId: windowId,
        },
        orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
      }),
    ]);

    return {
      window,
      employeeId: employee.id,
      status: submission?.status ?? AvailabilitySubmissionStatus.DRAFT,
      submittedAt: submission?.submittedAt ?? null,
      reviewedAt: submission?.reviewedAt ?? null,
      reviewedByUserId: submission?.reviewedByUserId ?? null,
      availability,
    };
  }

  async saveWindowAvailabilityForEmployee(
    organisationId: string,
    userId: string,
    windowId: string,
    availabilities: Array<{
      date: string;
      startMinutes: number;
      endMinutes: number;
      status?: AvailabilityStatus;
      notes?: string;
    }>,
    submit?: boolean,
  ) {
    const window = await this.findWindowById(organisationId, windowId);
    this.ensureWindowOpen(window);

    if (submit && availabilities.length === 0) {
      this.logger.log('Submitting default availability with no time slots.');
    }

    const employee = await this.findEmployeeByUserId(organisationId, userId);
    const existing = await this.prisma.availabilitySubmission.findUnique({
      where: {
        windowId_employeeId: { windowId, employeeId: employee.id },
      },
    });

    const wasSubmitted =
      existing &&
      [
        AvailabilitySubmissionStatus.SUBMITTED,
        AvailabilitySubmissionStatus.REVIEWED,
      ].includes(existing.status);

    this.validateIntervals(availabilities);

    for (const entry of availabilities) {
      const entryDate = new Date(entry.date);
      if (Number.isNaN(entryDate.getTime())) {
        throw new BadRequestException('Nieprawidłowa data dyspozycji.');
      }
      this.ensureDateWithinWindow(entryDate, window);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: {
          organisationId,
          employeeId: employee.id,
          availabilityWindowId: windowId,
        },
      });

      const availability = await Promise.all(
        availabilities.map((entry) => {
          const status = entry.status ?? AvailabilityStatus.AVAILABLE;
          const startMinutes =
            status === AvailabilityStatus.DAY_OFF ? 0 : entry.startMinutes;
          const endMinutes =
            status === AvailabilityStatus.DAY_OFF ? 0 : entry.endMinutes;
          if (
            status !== AvailabilityStatus.DAY_OFF &&
            endMinutes <= startMinutes
          ) {
            throw new BadRequestException(
              'endMinutes must be greater than startMinutes',
            );
          }
          return tx.availability.create({
            data: {
              organisationId,
              employeeId: employee.id,
              availabilityWindowId: windowId,
              date: new Date(entry.date),
              startMinutes,
              endMinutes,
              status,
              notes: entry.notes ?? null,
            },
          });
        }),
      );

      const status = submit
        ? AvailabilitySubmissionStatus.SUBMITTED
        : wasSubmitted
          ? AvailabilitySubmissionStatus.DRAFT
          : (existing?.status ?? AvailabilitySubmissionStatus.DRAFT);

      const submission = await tx.availabilitySubmission.upsert({
        where: {
          windowId_employeeId: { windowId, employeeId: employee.id },
        },
        update: {
          status,
          submittedAt: submit
            ? new Date()
            : wasSubmitted
              ? null
              : (existing?.submittedAt ?? null),
          submittedByUserId: submit
            ? userId
            : wasSubmitted
              ? null
              : (existing?.submittedByUserId ?? null),
          reviewedAt: submit
            ? null
            : wasSubmitted
              ? null
              : (existing?.reviewedAt ?? null),
          reviewedByUserId: submit
            ? null
            : wasSubmitted
              ? null
              : (existing?.reviewedByUserId ?? null),
        },
        create: {
          organisationId,
          windowId,
          employeeId: employee.id,
          status,
          submittedAt: submit ? new Date() : null,
          submittedByUserId: submit ? userId : null,
        },
      });

      return { availability, submission };
    });

    await this.auditService.record({
      organisationId,
      actorUserId: userId,
      action: wasSubmitted
        ? 'AVAILABILITY_SUBMISSION_EDIT_AFTER_SUBMIT'
        : submit
          ? 'availability.submission.submitted'
          : 'availability.submission.saved',
      entityType: 'availability_submission',
      entityId: created.submission.id,
      after: {
        windowId,
        employeeId: employee.id,
        status: created.submission.status,
      },
    });

    if (submit) {
      const roleCandidates = [Role.OWNER, Role.MANAGER, Role.ADMIN];
      let managers = await this.findUsersByRole(organisationId, roleCandidates);

      if (!managers.length && roleCandidates.includes(Role.ADMIN)) {
        managers = await this.findUsersByRole(organisationId, [
          Role.OWNER,
          Role.MANAGER,
        ]);
      }

      await Promise.all(
        managers.map((manager) =>
          this.notificationsService.createNotification({
            organisationId,
            userId: manager.id,
            type: NotificationType.AVAILABILITY_SUBMITTED,
            title: 'Nowa dyspozycja',
            body: `${employee.firstName} ${employee.lastName} przesłał(a) dyspozycję na ${window.title}.`,
            data: {
              windowId,
              employeeId: employee.id,
            },
          }),
        ),
      );
    }

    return {
      window,
      employeeId: employee.id,
      status: created.submission.status,
      submittedAt: created.submission.submittedAt,
      reviewedAt: created.submission.reviewedAt ?? null,
      reviewedByUserId: created.submission.reviewedByUserId ?? null,
      availability: created.availability,
    };
  }

  async getWindowTeamAvailabilityStats(
    organisationId: string,
    windowId: string,
  ) {
    const [totalEmployees, submittedCount, reviewedCount] = await Promise.all([
      this.prisma.employee.count({ where: { organisationId } }),
      this.prisma.availabilitySubmission.count({
        where: {
          organisationId,
          windowId,
          status: AvailabilitySubmissionStatus.SUBMITTED,
        },
      }),
      this.prisma.availabilitySubmission.count({
        where: {
          organisationId,
          windowId,
          status: AvailabilitySubmissionStatus.REVIEWED,
        },
      }),
    ]);

    return {
      totalEmployees,
      submittedCount,
      reviewedCount,
      pendingCount: totalEmployees - submittedCount - reviewedCount,
    };
  }

  private async findUsersByRole(
    organisationId: string,
    roles: Role[],
  ) {
    try {
      return await this.prisma.user.findMany({
        where: {
          organisationId,
          role: { in: roles },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2007' &&
        typeof error.meta?.driverAdapterError === 'object' &&
        error.meta?.driverAdapterError !== null &&
        String(error.meta.driverAdapterError.message ?? '').includes('Role')
      ) {
        return this.prisma.user.findMany({
          where: {
            organisationId,
            role: { in: roles.filter((role) => role !== Role.ADMIN) },
          },
        });
      }
      throw error;
    }
  }

  async getWindowTeamAvailability(
    organisationId: string,
    windowId: string,
    query: TeamAvailabilityQuery = {},
  ): Promise<{ data: EmployeeAvailabilitySummary[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const whereClause: Prisma.EmployeeWhereInput = { organisationId };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.locationId) {
      whereClause.locations = {
        some: { locationId: query.locationId },
      };
    }

    if (query.role) {
      whereClause.user = {
        role: query.role as Role,
      };
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: perPage,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        include: {
          locations: {
            include: {
              location: { select: { id: true, name: true } },
            },
          },
          availabilitySubmissions: {
            where: { windowId },
            select: {
              status: true,
              submittedAt: true,
              reviewedAt: true,
            },
            take: 1,
          },
          user: {
            select: { role: true },
          },
        },
      }),
      this.prisma.employee.count({ where: whereClause }),
    ]);

    const data: EmployeeAvailabilitySummary[] = employees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      position: emp.position,
      locations: emp.locations.map((la) => ({
        id: la.location.id,
        name: la.location.name,
      })),
      availabilityCount: 0,
      hasWeeklyDefault: false,
      submissionStatus:
        emp.availabilitySubmissions[0]?.status ??
        AvailabilitySubmissionStatus.DRAFT,
      submittedAt: emp.availabilitySubmissions[0]?.submittedAt ?? null,
      reviewedAt: emp.availabilitySubmissions[0]?.reviewedAt ?? null,
    }));

    return { data, total };
  }

  async getWindowEmployeeAvailability(
    organisationId: string,
    windowId: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      include: {
        locations: {
          include: {
            location: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, role: true, email: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [availability, submission] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          organisationId,
          employeeId,
          availabilityWindowId: windowId,
        },
        orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
      }),
      this.prisma.availabilitySubmission.findUnique({
        where: {
          windowId_employeeId: { windowId, employeeId },
        },
      }),
    ]);

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        locations: employee.locations.map((la) => ({
          id: la.location.id,
          name: la.location.name,
        })),
        role: employee.user?.role ?? null,
      },
      status: submission?.status ?? AvailabilitySubmissionStatus.DRAFT,
      submittedAt: submission?.submittedAt ?? null,
      reviewedAt: submission?.reviewedAt ?? null,
      availability,
    };
  }

  async updateWindowAvailabilityForEmployee(
    organisationId: string,
    windowId: string,
    employeeId: string,
    availabilities: Array<{
      date: string;
      startMinutes: number;
      endMinutes: number;
      status?: AvailabilityStatus;
      notes?: string;
    }>,
    actorUserId: string,
  ) {
    const window = await this.findWindowById(organisationId, windowId);
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    this.validateIntervals(availabilities);

    for (const entry of availabilities) {
      this.ensureDateWithinWindow(new Date(entry.date), window);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: {
          organisationId,
          employeeId,
          availabilityWindowId: windowId,
        },
      });

      const availability = await Promise.all(
        availabilities.map((entry) => {
          const status = entry.status ?? AvailabilityStatus.AVAILABLE;
          const startMinutes =
            status === AvailabilityStatus.DAY_OFF ? 0 : entry.startMinutes;
          const endMinutes =
            status === AvailabilityStatus.DAY_OFF ? 0 : entry.endMinutes;
          if (
            status !== AvailabilityStatus.DAY_OFF &&
            endMinutes <= startMinutes
          ) {
            throw new BadRequestException(
              'endMinutes must be greater than startMinutes',
            );
          }
          return tx.availability.create({
            data: {
              organisationId,
              employeeId,
              availabilityWindowId: windowId,
              date: new Date(entry.date),
              startMinutes,
              endMinutes,
              status,
              notes: entry.notes ?? null,
            },
          });
        }),
      );

      const submission = await tx.availabilitySubmission.upsert({
        where: {
          windowId_employeeId: { windowId, employeeId },
        },
        update: {
          status: AvailabilitySubmissionStatus.REVIEWED,
          reviewedAt: new Date(),
          reviewedByUserId: actorUserId,
        },
        create: {
          organisationId,
          windowId,
          employeeId,
          status: AvailabilitySubmissionStatus.REVIEWED,
          reviewedAt: new Date(),
          reviewedByUserId: actorUserId,
        },
      });

      return { availability, submission };
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'availability.submission.admin_updated',
      entityType: 'availability_submission',
      entityId: result.submission.id,
      after: { windowId, employeeId, status: result.submission.status },
    });

    return {
      employeeId,
      status: result.submission.status,
      availability: result.availability,
      reviewedAt: result.submission.reviewedAt ?? null,
    };
  }

  async updateSubmissionStatus(
    organisationId: string,
    windowId: string,
    employeeId: string,
    status: AvailabilitySubmissionStatus,
    actorUserId: string,
  ) {
    const submission = await this.prisma.availabilitySubmission.findUnique({
      where: { windowId_employeeId: { windowId, employeeId } },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const updated = await this.prisma.availabilitySubmission.update({
      where: { id: submission.id },
      data: {
        status,
        reviewedAt:
          status === AvailabilitySubmissionStatus.REVIEWED ? new Date() : null,
        reviewedByUserId:
          status === AvailabilitySubmissionStatus.REVIEWED ? actorUserId : null,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId,
      action: 'availability.submission.status_updated',
      entityType: 'availability_submission',
      entityId: updated.id,
      after: {
        status,
        windowId,
        employeeId,
      },
    });

    return updated;
  }

  // ==========================================
  // TEAM AVAILABILITY (Admin endpoints)
  // ==========================================

  /**
   * Get list of all employees with availability summary
   */
  async getTeamAvailability(
    organisationId: string,
    query: TeamAvailabilityQuery = {},
  ): Promise<{ data: EmployeeAvailabilitySummary[]; total: number }> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    // Build where clause for employees
    const whereClause: Prisma.EmployeeWhereInput = { organisationId };

    if (query.search) {
      whereClause.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.locationId) {
      whereClause.locations = {
        some: { locationId: query.locationId },
      };
    }

    // Filter by role in the query if specified
    if (query.role) {
      whereClause.user = {
        role: query.role as Role,
      };
    }

    // Get employees with their availability counts
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: perPage,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        include: {
          locations: {
            include: {
              location: { select: { id: true, name: true } },
            },
          },
          availability: {
            where: { availabilityWindowId: null },
            select: { id: true, weekday: true },
          },
          user: {
            select: { role: true },
          },
        },
      }),
      this.prisma.employee.count({ where: whereClause }),
    ]);

    const data: EmployeeAvailabilitySummary[] = employees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      position: emp.position,
      locations: emp.locations.map((la) => ({
        id: la.location.id,
        name: la.location.name,
      })),
      availabilityCount: emp.availability.length,
      hasWeeklyDefault: emp.availability.some((a) => a.weekday !== null),
    }));

    return { data, total };
  }

  /**
   * Get detailed availability for a specific employee (admin only)
   */
  async getEmployeeAvailability(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      include: {
        locations: {
          include: {
            location: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, role: true, email: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const availability = await this.prisma.availability.findMany({
      where: {
        organisationId,
        employeeId,
        availabilityWindowId: null,
      },
      orderBy: [{ weekday: 'asc' }, { date: 'asc' }, { startMinutes: 'asc' }],
    });

    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        locations: employee.locations.map((la) => ({
          id: la.location.id,
          name: la.location.name,
        })),
        role: employee.user?.role ?? null,
      },
      availability,
    };
  }

  /**
   * Update availability for a specific employee (admin only)
   */
  async updateEmployeeAvailability(
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
    // Verify employee belongs to organisation
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    this.ensureEmployeeActive(employee);

    // Validate intervals before saving
    this.validateIntervals(availabilities);

    return this.bulkUpsertForEmployee(
      organisationId,
      employeeId,
      availabilities,
    );
  }

  /**
   * Get availability statistics for the team
   */
  async getTeamAvailabilityStats(organisationId: string) {
    const [totalEmployees, employeesWithAvailability, activeWindows] =
      await Promise.all([
        this.prisma.employee.count({ where: { organisationId } }),
        this.prisma.employee.count({
          where: {
            organisationId,
            availability: { some: { availabilityWindowId: null } },
          },
        }),
        this.findActiveWindows(organisationId),
      ]);

    const activeWindow = activeWindows[0] ?? null;
    const activeWindowSubmissionStats = activeWindow
      ? await this.getWindowTeamAvailabilityStats(
          organisationId,
          activeWindow.id,
        )
      : null;

    return {
      totalEmployees,
      employeesWithAvailability,
      employeesWithoutAvailability: totalEmployees - employeesWithAvailability,
      hasActiveWindow: activeWindows.length > 0,
      activeWindow,
      activeWindowSubmissionStats,
    };
  }
}
