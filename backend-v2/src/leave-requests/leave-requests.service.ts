import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LeaveStatus, LeaveType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

type ScopeOptions = {
  restrictToEmployeeId?: string;
};

@Injectable()
export class LeaveRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organisationId: string,
    dto: CreateLeaveRequestDto,
    options: { userId: string; role: Role },
  ) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const employeeId = await this.resolveEmployeeId(
      organisationId,
      dto.employeeId,
      options,
    );

    const created = await this.prisma.leaveRequest.create({
      data: {
        organisationId,
        employeeId,
        createdByUserId: options.userId,
        type: dto.type as LeaveType,
        startDate,
        endDate,
        reason: dto.reason ?? null,
        attachmentUrl: dto.attachmentUrl ?? null,
      },
      include: leaveRelations,
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

  async findOne(
    organisationId: string,
    id: string,
    options?: ScopeOptions,
  ) {
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

    const nextStart = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const nextEnd = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (nextStart.getTime() > nextEnd.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        type: (dto.type as LeaveType | undefined) ?? existing.type,
        startDate: nextStart,
        endDate: nextEnd,
        reason: dto.reason ?? existing.reason,
        attachmentUrl: dto.attachmentUrl ?? existing.attachmentUrl,
      },
      include: leaveRelations,
    });

    return updated;
  }

  async updateStatus(
    organisationId: string,
    id: string,
    dto: { status: LeaveStatus; rejectionReason?: string },
    approverUserId: string,
  ) {
    const existing = await this.prisma.leaveRequest.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Leave request not found');
    }

    const status = dto.status;
    const data: Prisma.LeaveRequestUpdateInput = {
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
}

const leaveRelations: Prisma.LeaveRequestInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, email: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};
