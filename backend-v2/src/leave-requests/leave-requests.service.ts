import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LeaveCategory,
  LeaveStatus,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { LeaveBalanceService } from './leave-balance.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { FindLeaveRequestsQueryDto } from './dto/find-leave-requests-query.dto';
import { EmployeesService } from '../employees/employees.service';

type AccessScope = {
  restrictToEmployeeId?: string;
  actorUserId?: string;
  actorRole?: Role;
};

export const ELEVATED_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.ADMIN];

const LEAVE_INCLUDE = {
  employee: true,
  leaveType: true,
  approvedBy: true,
  createdBy: true,
};

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly leaveBalanceService: LeaveBalanceService,
    private readonly employeesService: EmployeesService,
  ) {}

  async findEmployeeForUser(organisationId: string, userId: string) {
    return this.employeesService.ensureEmployeeProfile(organisationId, userId);
  }

  async findAll(
    organisationId: string,
    query: FindLeaveRequestsQueryDto,
    scope?: AccessScope,
  ) {
    const where: Prisma.LeaveRequestWhereInput = { organisationId };

    const take = Math.max(query.pageSize ?? query.take ?? 20, 1);
    const skipCandidate =
      query.skip ?? (query.page ? (query.page - 1) * take : 0);
    const skip = Math.max(skipCandidate ?? 0, 0);

    if (scope?.restrictToEmployeeId) {
      where.employeeId = scope.restrictToEmployeeId;
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.leaveTypeId) {
      where.leaveTypeId = query.leaveTypeId;
    }

    if (query.from || query.to) {
      where.startDate = {};
      if (query.from) {
        (where.startDate as Prisma.DateTimeFilter).gte = new Date(query.from);
      }
      if (query.to) {
        (where.startDate as Prisma.DateTimeFilter).lte = new Date(query.to);
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { startDate: 'desc' },
        include: LEAVE_INCLUDE,
        skip,
        take,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findApprovedForSchedule(
    organisationId: string,
    from?: Date,
    to?: Date,
  ) {
    const where: Prisma.LeaveRequestWhereInput = {
      organisationId,
      status: LeaveStatus.APPROVED,
    };

    if (from || to) {
      where.AND = [];
      if (from) {
        where.AND.push({
          endDate: { gte: from },
        });
      }
      if (to) {
        where.AND.push({
          startDate: { lte: to },
        });
      }
    }

    return this.prisma.leaveRequest.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        startDate: true,
        endDate: true,
        type: true,
        leaveType: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async getRequestHistory(organisationId: string, leaveRequestId: string) {
    // Get audit logs for this leave request
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organisationId,
        entityType: 'LeaveRequest',
        entityId: leaveRequestId,
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorName:
        `${log.actor.firstName ?? ''} ${log.actor.lastName ?? ''}`.trim() ||
        log.actor.email,
      actorEmail: log.actor.email,
      createdAt: log.createdAt.toISOString(),
      before: log.before,
      after: log.after,
    }));
  }

  async findOne(organisationId: string, id: string, scope?: AccessScope) {
    const item = await this.prisma.leaveRequest.findFirst({
      where: { id, organisationId },
      include: LEAVE_INCLUDE,
    });

    if (!item) {
      throw new NotFoundException('Leave request not found');
    }

    if (
      scope?.restrictToEmployeeId &&
      item.employeeId !== scope.restrictToEmployeeId
    ) {
      throw new ForbiddenException(
        'You can only access your own leave requests',
      );
    }

    return item;
  }

  async create(
    organisationId: string,
    dto: CreateLeaveRequestDto,
    options: { userId: string; role: Role },
  ) {
    const targetEmployeeId =
      options.role === Role.EMPLOYEE
        ? (await this.findEmployeeForUser(organisationId, options.userId)).id
        : dto.employeeId;

    if (!targetEmployeeId) {
      throw new BadRequestException('employeeId is required');
    }

    if (!dto.type) {
      throw new BadRequestException('type is required');
    }

    const { startDate, endDate } = this.resolveDates(dto);

    if (dto.leaveTypeId) {
      await this.ensureLeaveType(organisationId, dto.leaveTypeId);

      // Validate leave balance
      const balanceCheck = await this.leaveBalanceService.validateBalance(
        organisationId,
        targetEmployeeId,
        dto.leaveTypeId,
        startDate,
        endDate,
      );

      if (!balanceCheck.valid) {
        throw new BadRequestException(balanceCheck.message);
      }
    }

    const created = await this.prisma.leaveRequest.create({
      data: {
        organisationId,
        employeeId: targetEmployeeId,
        createdByUserId: options.userId,
        leaveTypeId: dto.leaveTypeId ?? null,
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason ?? dto.notes ?? null,
      },
      include: LEAVE_INCLUDE,
    });

    await this.auditService.log({
      organisationId,
      actorUserId: options.userId,
      action: 'leave.create',
      entityType: 'LeaveRequest',
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async update(
    organisationId: string,
    id: string,
    dto: UpdateLeaveRequestDto,
    scope?: AccessScope,
  ) {
    const existing = await this.findOne(organisationId, id, scope);

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can be updated');
    }

    const data: Prisma.LeaveRequestUncheckedUpdateInput = {};

    if (dto.startsAt || dto.startDate || dto.endsAt || dto.endDate) {
      const { startDate, endDate } = this.resolveDates(dto);
      data.startDate = startDate;
      data.endDate = endDate;
    }

    if (dto.type !== undefined) {
      data.type = dto.type;
    }

    if (dto.leaveTypeId) {
      await this.ensureLeaveType(organisationId, dto.leaveTypeId);
      data.leaveTypeId = dto.leaveTypeId;
    }

    if (dto.reason !== undefined || dto.notes !== undefined) {
      data.reason = dto.reason ?? dto.notes ?? null;
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data,
      include: LEAVE_INCLUDE,
    });

    if (scope?.actorUserId) {
      await this.auditService.log({
        organisationId,
        actorUserId: scope.actorUserId,
        action: 'leave.update',
        entityType: 'LeaveRequest',
        entityId: id,
        before: existing,
        after: updated,
      });
    }

    return updated;
  }

  async updateStatus(
    organisationId: string,
    id: string,
    dto: UpdateLeaveRequestStatusDto,
    approverUserId: string,
    scope?: AccessScope,
  ) {
    const existing = await this.findOne(organisationId, id, scope);

    if (
      scope?.restrictToEmployeeId &&
      existing.employeeId !== scope.restrictToEmployeeId
    ) {
      throw new UnauthorizedException();
    }

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only PENDING requests can change status');
    }

    if (
      dto.status !== LeaveStatus.CANCELLED &&
      scope?.actorRole &&
      !ELEVATED_ROLES.includes(scope.actorRole)
    ) {
      throw new ForbiddenException('Only managers/owners can approve/reject');
    }

    this.ensureStatusTransition(existing.status, dto.status);

    // Validate balance before approval
    if (dto.status === LeaveStatus.APPROVED && existing.leaveTypeId) {
      const balanceCheck = await this.leaveBalanceService.validateBalance(
        organisationId,
        existing.employeeId,
        existing.leaveTypeId,
        existing.startDate,
        existing.endDate,
      );

      if (!balanceCheck.valid) {
        throw new BadRequestException(balanceCheck.message);
      }
    }

    const data: Prisma.LeaveRequestUncheckedUpdateInput = {
      status: dto.status,
      approvedByUserId:
        dto.status === LeaveStatus.CANCELLED ? null : approverUserId,
      decisionAt: new Date(),
      rejectionReason: dto.note ?? null,
    };

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data,
      include: LEAVE_INCLUDE,
    });

    // Update leave balance when approved
    if (dto.status === LeaveStatus.APPROVED && existing.leaveTypeId) {
      await this.leaveBalanceService.updateUsedBalance(
        organisationId,
        existing.employeeId,
        existing.leaveTypeId,
        existing.startDate,
        existing.endDate,
        'add',
      );
    }

    await this.auditService.log({
      organisationId,
      actorUserId: approverUserId,
      action: 'leave.status_change',
      entityType: 'LeaveRequest',
      entityId: id,
      before: existing,
      after: updated,
    });

    await this.notifyStatusChange(updated, organisationId, dto.status);

    return updated;
  }

  private resolveDates(input: {
    startDate?: string;
    endDate?: string;
    startsAt?: string;
    endsAt?: string;
  }) {
    const startRaw = input.startDate ?? input.startsAt;
    const endRaw = input.endDate ?? input.endsAt;

    if (!startRaw || !endRaw) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const startDate = new Date(startRaw);
    const endDate = new Date(endRaw);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    return { startDate, endDate };
  }

  private async ensureLeaveType(organisationId: string, leaveTypeId: string) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: leaveTypeId, organisationId, isActive: true },
    });

    if (!leaveType) {
      throw new BadRequestException(
        'Wybrany typ urlopu jest niedostępny w tej organizacji',
      );
    }

    return leaveType;
  }

  private ensureStatusTransition(current: LeaveStatus, next: LeaveStatus) {
    const allowed: Record<LeaveStatus, LeaveStatus[]> = {
      [LeaveStatus.PENDING]: [
        LeaveStatus.APPROVED,
        LeaveStatus.REJECTED,
        LeaveStatus.CANCELLED,
      ],
      [LeaveStatus.APPROVED]: [LeaveStatus.CANCELLED],
      [LeaveStatus.REJECTED]: [],
      [LeaveStatus.CANCELLED]: [],
    };

    if (!(allowed[current] ?? []).includes(next)) {
      throw new BadRequestException(
        `Zmiana statusu z ${current} na ${next} jest niedozwolona`,
      );
    }
  }

  private async notifyStatusChange(
    request: Prisma.LeaveRequestGetPayload<{ include: typeof LEAVE_INCLUDE }>,
    organisationId: string,
    status: LeaveStatus,
  ) {
    const employeeUserId = request.employee?.userId;
    if (!employeeUserId) {
      return;
    }

    const statusLabel =
      status === LeaveStatus.APPROVED
        ? 'zatwierdzony'
        : status === LeaveStatus.REJECTED
          ? 'odrzucony'
          : 'zaktualizowany';

    await this.notificationsService.createNotification({
      organisationId,
      userId: employeeUserId,
      type: NotificationType.LEAVE_STATUS,
      title: `Status wniosku: ${status}`,
      body: `Twój wniosek został ${statusLabel}.`,
      data: {
        leaveRequestId: request.id,
        status,
      },
    });
  }
}
