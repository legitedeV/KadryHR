import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LeaveStatus,
  LeaveCategory,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

type ScopeOptions = {
  restrictToEmployeeId?: string;
};

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    organisationId: string,
    dto: CreateLeaveRequestDto,
    options: { userId: string; role: Role },
  ) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const employeeId = await this.resolveEmployeeId(
      organisationId,
      dto.employeeId,
      options,
    );

    const leaveType = dto.leaveTypeId
      ? await this.ensureLeaveType(organisationId, dto.leaveTypeId)
      : null;

    const created = await this.prisma.leaveRequest.create({
      data: {
        organisationId,
        employeeId,
        createdByUserId: options.userId,
        type: leaveType?.code ?? dto.type,
        leaveTypeId: leaveType?.id ?? null,
        startDate,
        endDate,
        reason: dto.reason ?? null,
        attachmentUrl: dto.attachmentUrl ?? null,
      },
      include: leaveRelations,
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

  async findAll(
    organisationId: string,
    query: QueryLeaveRequestsDto,
    options?: ScopeOptions,
  ) {
    const take = Math.min(query.take ?? query.pageSize ?? 20, 100);
    const page = query.page ?? 1;
    const skip = query.skip ?? (page - 1) * take;

    const where = this.buildWhere(organisationId, query, options);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take,
        include: leaveRelations,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: items,
      total,
      skip,
      take,
    };
  }

  async findOne(organisationId: string, id: string, options?: ScopeOptions) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: this.buildWhere(organisationId, {}, options, id),
      include: leaveRelations,
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    return request;
  }

  async update(
    organisationId: string,
    id: string,
    dto: UpdateLeaveRequestDto,
    options?: { restrictToEmployeeId?: string; userId?: string },
  ) {
    const existing = await this.prisma.leaveRequest.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Leave request not found');
    }

    if (
      options?.restrictToEmployeeId &&
      existing.employeeId !== options.restrictToEmployeeId
    ) {
      throw new UnauthorizedException();
    }

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be edited');
    }

    const nextStart = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const nextEnd = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (nextStart.getTime() > nextEnd.getTime()) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const leaveType = dto.leaveTypeId
      ? await this.ensureLeaveType(organisationId, dto.leaveTypeId)
      : null;

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        type: leaveType?.code ?? dto.type ?? existing.type,
        leaveTypeId:
          leaveType?.id ??
          (dto.leaveTypeId === null ? null : existing.leaveTypeId ?? null),
        startDate: nextStart,
        endDate: nextEnd,
        reason: dto.reason ?? existing.reason,
        attachmentUrl: dto.attachmentUrl ?? existing.attachmentUrl,
      },
      include: leaveRelations,
    });

    await this.auditService.log({
      organisationId,
      actorUserId: options?.userId ?? existing.createdByUserId,
      action: 'leave.update',
      entityType: 'LeaveRequest',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async updateStatus(
    organisationId: string,
    id: string,
    dto: { status: LeaveStatus; rejectionReason?: string },
    approverUserId: string,
    options?: ScopeOptions,
  ) {
    const existing = await this.prisma.leaveRequest.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Leave request not found');
    }

    if (
      options?.restrictToEmployeeId &&
      existing.employeeId !== options.restrictToEmployeeId
    ) {
      throw new UnauthorizedException();
    }

    this.ensureStatusTransition(existing.status, dto.status);

    const status = dto.status;
    const data: Prisma.LeaveRequestUncheckedUpdateInput = {
      status,
      approvedByUserId: approverUserId,
      decisionAt: new Date(),
      rejectionReason: dto.rejectionReason ?? null,
    };

    if (status === LeaveStatus.PENDING) {
      data.approvedByUserId = null;
      data.decisionAt = null;
      data.rejectionReason = null;
    }

    if (status === LeaveStatus.APPROVED) {
      data.rejectionReason = null;
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data,
      include: leaveRelations,
    });

    await this.auditService.log({
      organisationId,
      actorUserId: approverUserId,
      action: 'leave.status_change',
      entityType: 'LeaveRequest',
      entityId: id,
      before: existing,
      after: updated,
    });

    await this.notifyStatusChange(updated, organisationId, status);

    return updated;
  }

  private buildWhere(
    organisationId: string,
    query: Partial<QueryLeaveRequestsDto> = {},
    options?: ScopeOptions,
    id?: string,
  ): Prisma.LeaveRequestWhereInput {
    const where: Prisma.LeaveRequestWhereInput = {
      organisationId,
    };

    if (id) {
      where.id = id;
    }

    if (options?.restrictToEmployeeId) {
      where.employeeId = options.restrictToEmployeeId;
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

    if (query.from) {
      where.startDate = {
        ...(where.startDate as Prisma.DateTimeFilter | undefined),
        gte: new Date(query.from),
      };
    }

    if (query.to) {
      where.startDate = {
        ...(where.startDate as Prisma.DateTimeFilter | undefined),
        lte: new Date(query.to),
      };
    }

    return where;
  }

  private async resolveEmployeeId(
    organisationId: string,
    requestedEmployeeId: string | undefined,
    options: { userId: string; role: Role },
  ) {
    if (options.role === Role.EMPLOYEE) {
      const selfEmployee = await this.prisma.employee.findFirst({
        where: { organisationId, userId: options.userId },
      });
      if (!selfEmployee) {
        throw new BadRequestException('Employee profile not found for user');
      }
      if (requestedEmployeeId && requestedEmployeeId !== selfEmployee.id) {
        throw new UnauthorizedException();
      }
      return selfEmployee.id;
    }

    if (requestedEmployeeId) {
      await this.ensureEmployee(organisationId, requestedEmployeeId);
      return requestedEmployeeId;
    }

    throw new BadRequestException('employeeId is required');
  }

  private async ensureEmployee(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found in organisation');
    }
    return employee;
  }

  async findEmployeeForUser(organisationId: string, userId: string) {
    return this.prisma.employee.findFirst({
      where: { organisationId, userId },
    });
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

    const allowedNext = allowed[current] ?? [];
    if (!allowedNext.includes(next)) {
      throw new BadRequestException(
        `Zmiana statusu z ${current} na ${next} jest niedozwolona`,
      );
    }
  }

  private async notifyStatusChange(
    request: Prisma.LeaveRequestGetPayload<{ include: typeof leaveRelations }>,
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

const leaveRelations: Prisma.LeaveRequestInclude = {
  employee: {
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  approvedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  leaveType: true,
};
