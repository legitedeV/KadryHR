import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { FindLeaveRequestsQueryDto } from './dto/find-leave-requests-query.dto';
import { AuditService } from '../audit/audit.service';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

type AccessScope = {
  employeeId?: string;     // if set => restrict access to only that employee’s requests
  actorUserId?: string;    // audit/approver linkage
  actorRole?: Role;
};

function getModel(modelName: string) {
  return Prisma.dmmf?.datamodel?.models?.find((m) => m.name === modelName) ?? null;
}

function getFieldNames(modelName: string): Set<string> {
  const m = getModel(modelName);
  return new Set((m?.fields ?? []).map((f) => f.name));
}

function getRelationNames(modelName: string): Set<string> {
  const m = getModel(modelName);
  return new Set(
    (m?.fields ?? [])
      .filter((f) => f.kind === 'object')
      .map((f) => f.name),
  );
}

const LEAVE_FIELDS = getFieldNames('LeaveRequest');
const LEAVE_RELATIONS = getRelationNames('LeaveRequest');

function normalizeDate(input: string | Date): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  return d;
}

function validateRange(startsAt: Date, endsAt: Date) {
  if (startsAt >= endsAt) {
    throw new BadRequestException('startsAt must be before endsAt');
  }
}

function setIfField(data: any, field: string, value: any) {
  if (LEAVE_FIELDS.has(field)) data[field] = value;
}

function setApprover(data: any, approverUserId: string) {
  if (LEAVE_FIELDS.has('approvedByUserId')) {
    data.approvedByUserId = approverUserId;
    return;
  }
  if (LEAVE_FIELDS.has('approvedById')) {
    data.approvedById = approverUserId;
    return;
  }
  if (LEAVE_RELATIONS.has('approvedByUser')) {
    data.approvedByUser = { connect: { id: approverUserId } };
    return;
  }
  if (LEAVE_RELATIONS.has('approvedBy')) {
    data.approvedBy = { connect: { id: approverUserId } };
    return;
  }
}

function clearApprover(data: any) {
  if (LEAVE_FIELDS.has('approvedByUserId')) {
    data.approvedByUserId = null;
    return;
  }
  if (LEAVE_FIELDS.has('approvedById')) {
    data.approvedById = null;
    return;
  }
  if (LEAVE_RELATIONS.has('approvedByUser')) {
    data.approvedByUser = { disconnect: true };
    return;
  }
  if (LEAVE_RELATIONS.has('approvedBy')) {
    data.approvedBy = { disconnect: true };
    return;
  }
}

function extractDates(dto: {
  startsAt?: string;
  endsAt?: string;
  startDate?: string;
  endDate?: string;
}) {
  const startRaw = dto.startsAt ?? dto.startDate;
  const endRaw = dto.endsAt ?? dto.endDate;

  if (!startRaw || !endRaw) {
    throw new BadRequestException('startsAt/endsAt (or startDate/endDate) are required');
  }

  const startsAt = normalizeDate(startRaw);
  const endsAt = normalizeDate(endRaw);
  validateRange(startsAt, endsAt);

  return { startsAt, endsAt };
}

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async findEmployeeForUser(organisationId: string, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { organisationId, userId },
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
    query: FindLeaveRequestsQueryDto,
    scope?: AccessScope,
  ) {
    const where: any = { organisationId };

    if (scope?.employeeId) {
      where.employeeId = scope.employeeId;
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status && LEAVE_FIELDS.has('status')) {
      where.status = query.status;
    }

    const from = query.from ? normalizeDate(query.from) : null;
    const to = query.to ? normalizeDate(query.to) : null;

    // date filters only if schema has startsAt/endsAt
    if ((from || to) && LEAVE_FIELDS.has('startsAt')) {
      where.startsAt = {};
      if (from) where.startsAt.gte = from;
      if (to) where.startsAt.lte = to;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: this.buildInclude(),
      orderBy: this.buildOrderBy(),
    } as any);
  }

  async findOne(organisationId: string, id: string, scope?: AccessScope) {
    const where: any = { id, organisationId };

    const item = await this.prisma.leaveRequest.findFirst({
      where,
      include: this.buildInclude(),
    } as any);

    if (!item) {
      throw new NotFoundException('Leave request not found');
    }

    if (scope?.employeeId && (item as any).employeeId !== scope.employeeId) {
      throw new ForbiddenException('You can only access your own leave requests');
    }

    return item;
  }

  async update(
    organisationId: string,
    id: string,
    dto: UpdateLeaveRequestDto,
    scope?: AccessScope,
  ) {
    const existing = await this.findOne(organisationId, id, scope);

    const existingStatus = (existing as any).status as LeaveStatus | undefined;
    if (existingStatus && existingStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be updated');
    }

    const data: any = {};

    // dates (optional)
    const startRaw = dto.startsAt ?? dto.startDate;
    const endRaw = dto.endsAt ?? dto.endDate;

    if (startRaw || endRaw) {
      const startsAt = normalizeDate(startRaw ?? (existing as any).startsAt ?? (existing as any).startDate);
      const endsAt = normalizeDate(endRaw ?? (existing as any).endsAt ?? (existing as any).endDate);
      validateRange(startsAt, endsAt);

      if (LEAVE_FIELDS.has('startsAt')) data.startsAt = startsAt;
      if (LEAVE_FIELDS.has('endsAt')) data.endsAt = endsAt;
      if (LEAVE_FIELDS.has('startDate')) data.startDate = startsAt;
      if (LEAVE_FIELDS.has('endDate')) data.endDate = endsAt;
    }

    // reason/notes
    const reason = dto.reason ?? dto.notes;
    if (reason !== undefined) {
      if (LEAVE_FIELDS.has('reason')) data.reason = reason ?? null;
      else if (LEAVE_FIELDS.has('notes')) data.notes = reason ?? null;
      else if (LEAVE_FIELDS.has('comment')) data.comment = reason ?? null;
    }

    // leave type
    if (dto.leaveTypeId) {
      if (LEAVE_FIELDS.has('leaveTypeId')) data.leaveTypeId = dto.leaveTypeId;
      else if (LEAVE_RELATIONS.has('leaveType')) data.leaveType = { connect: { id: dto.leaveTypeId } };
    } else if (dto.type || dto.leaveType) {
      const type = dto.type ?? dto.leaveType ?? null;
      if (LEAVE_FIELDS.has('type')) data.type = type;
      else if (LEAVE_FIELDS.has('leaveType')) data.leaveType = type;
    }

    const leaveType = dto.leaveTypeId
      ? await this.ensureLeaveType(organisationId, dto.leaveTypeId)
      : null;

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: data as any,
      include: this.buildInclude(),
    } as any);
  }

  async updateStatus(
    organisationId: string,
    id: string,
    dto: { status: LeaveStatus; rejectionReason?: string },
    approverUserId: string,
    options?: ScopeOptions,
  ) {
    const existing = await this.findOne(organisationId, id, scope);
    const existingStatus = (existing as any).status as LeaveStatus | undefined;

    if (existingStatus && existingStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can change status');
    }

    if (
      options?.restrictToEmployeeId &&
      existing.employeeId !== options.restrictToEmployeeId
    ) {
      throw new UnauthorizedException();
    }

    this.ensureStatusTransition(existing.status, dto.status);

    const actorRole = scope?.actorRole;
    const actorUserId = scope?.actorUserId;
    const status = dto.status;
    const data: Prisma.LeaveRequestUncheckedUpdateInput = {
      status,
      approvedByUserId: approverUserId,
      decisionAt: new Date(),
      rejectionReason: dto.rejectionReason ?? null,
    };

    if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
      if (actorRole !== Role.OWNER && actorRole !== Role.MANAGER) {
        throw new ForbiddenException('Only managers/owners can approve/reject');
      }
      if (!actorUserId) throw new BadRequestException('Missing actor user id');
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

    // manager note
    if (dto.note !== undefined) {
      if (LEAVE_FIELDS.has('managerNote')) data.managerNote = dto.note ?? null;
      else if (LEAVE_FIELDS.has('decisionNote')) data.decisionNote = dto.note ?? null;
      else if (LEAVE_FIELDS.has('note')) data.note = dto.note ?? null;
    }

    // timestamps (only if exist)
    if (dto.status === 'APPROVED') {
      setIfField(data, 'approvedAt', new Date());
      setIfField(data, 'rejectedAt', null);
      setIfField(data, 'cancelledAt', null);
      setApprover(data, actorUserId!);
    }

    if (dto.status === 'REJECTED') {
      setIfField(data, 'rejectedAt', new Date());
      setIfField(data, 'approvedAt', null);
      setIfField(data, 'cancelledAt', null);
      setApprover(data, actorUserId!);
    }

    if (dto.status === 'CANCELLED') {
      // employee cancellation should not keep approver linkage
      setIfField(data, 'cancelledAt', new Date());
      clearApprover(data);
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
      data: data as any,
      include: this.buildInclude(),
    } as any);

    await this.notifyStatusChange(updated, organisationId, status);

    return updated;
  }

  private buildInclude() {
    const include: any = {};

    if (LEAVE_RELATIONS.has('employee')) include.employee = true;
    if (LEAVE_RELATIONS.has('leaveType')) include.leaveType = true;
    if (LEAVE_RELATIONS.has('approvedByUser')) include.approvedByUser = true;
    if (LEAVE_RELATIONS.has('approvedBy')) include.approvedBy = true;

    return include;
  }

  private buildOrderBy() {
    // prefer startsAt if present, else createdAt, else no order
    if (LEAVE_FIELDS.has('startsAt')) return { startsAt: 'desc' };
    if (LEAVE_FIELDS.has('createdAt')) return { createdAt: 'desc' };
    return undefined;
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
