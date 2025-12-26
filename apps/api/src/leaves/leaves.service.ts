import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { FilterLeaveDto } from './dto/filter-leave.dto';
import { DecisionDto } from './dto/decision.dto';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, query: FilterLeaveDto) {
    const where: Prisma.LeaveRequestWhereInput = {
      orgId,
      status: query.status,
      type: query.type,
      employeeId: query.employeeId,
    };

    if (query.startFrom || query.startTo) {
      where.startDate = {};
      if (query.startFrom) {
        where.startDate.gte = new Date(query.startFrom);
      }
      if (query.startTo) {
        where.startDate.lte = new Date(query.startTo);
      }
    }

    if (query.search) {
      where.OR = [
        { employee: { name: { contains: query.search } } },
        { reason: { contains: query.search } },
      ];
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, orgId },
      include: { employee: true },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async create(orgId: string, dto: CreateLeaveDto, createdById?: string) {
    await this.ensureEmployee(orgId, dto.employeeId);
    this.validateDateRange(dto.startDate, dto.endDate);

    return this.prisma.leaveRequest.create({
      data: {
        orgId,
        employeeId: dto.employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: LeaveStatus.PENDING,
        createdById,
      },
      include: { employee: true },
    });
  }

  async update(orgId: string, id: string, dto: UpdateLeaveDto) {
    const existing = await this.get(orgId, id);

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated');
    }

    if (dto.employeeId) {
      await this.ensureEmployee(orgId, dto.employeeId);
    }

    if (dto.startDate || dto.endDate) {
      this.validateDateRange(dto.startDate ?? existing.startDate.toISOString(), dto.endDate ?? existing.endDate.toISOString());
    }

    return this.prisma.leaveRequest.update({
      where: { id: existing.id },
      data: {
        employeeId: dto.employeeId ?? existing.employeeId,
        type: dto.type ?? existing.type,
        startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
        reason: dto.reason ?? existing.reason,
      },
      include: { employee: true },
    });
  }

  async remove(orgId: string, id: string) {
    const existing = await this.get(orgId, id);

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be deleted');
    }

    await this.prisma.leaveRequest.delete({ where: { id: existing.id } });
  }

  async approve(orgId: string, id: string, dto: DecisionDto, decidedById?: string) {
    return this.updateStatus(orgId, id, LeaveStatus.APPROVED, dto, decidedById);
  }

  async reject(orgId: string, id: string, dto: DecisionDto, decidedById?: string) {
    return this.updateStatus(orgId, id, LeaveStatus.REJECTED, dto, decidedById);
  }

  async cancel(orgId: string, id: string, dto: DecisionDto, decidedById?: string) {
    return this.updateStatus(orgId, id, LeaveStatus.CANCELLED, dto, decidedById);
  }

  private async updateStatus(orgId: string, id: string, status: LeaveStatus, dto: DecisionDto, decidedById?: string) {
    const existing = await this.get(orgId, id);

    if (existing.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can transition');
    }

    return this.prisma.leaveRequest.update({
      where: { id: existing.id },
      data: {
        status,
        decisionNote: dto.note,
        decidedAt: new Date(),
        decidedById,
      },
      include: { employee: true },
    });
  }

  private async ensureEmployee(orgId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!employee) {
      throw new BadRequestException('Employee does not belong to this organization');
    }
  }

  private validateDateRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }
}
