import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole, TimeEntrySource, TimeEntryType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { ManualEntryDto } from "./dto/manual-entry.dto";

@Injectable()
export class RcpService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(userId: string, organizationId: string) {
    const employee = await this.findEmployeeForUser(userId, organizationId);
    if (!employee) {
      throw new BadRequestException("No employee linked to this user");
    }

    const lastEntry = await this.prisma.timeEntry.findFirst({
      where: { employeeId: employee.id, organizationId },
      orderBy: { timestamp: "desc" },
    });
    if (lastEntry && lastEntry.type !== TimeEntryType.CLOCK_OUT) {
      throw new BadRequestException("Employee is already clocked in");
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId: employee.id,
        type: TimeEntryType.CLOCK_IN,
        timestamp: new Date(),
        source: TimeEntrySource.WEB,
      },
    });
  }

  async clockOut(userId: string, organizationId: string) {
    const employee = await this.findEmployeeForUser(userId, organizationId);
    if (!employee) {
      throw new BadRequestException("No employee linked to this user");
    }

    const lastEntry = await this.prisma.timeEntry.findFirst({
      where: { employeeId: employee.id, organizationId },
      orderBy: { timestamp: "desc" },
    });
    if (!lastEntry || lastEntry.type === TimeEntryType.CLOCK_OUT) {
      throw new NotFoundException("No open time entry");
    }
    if (lastEntry.type === TimeEntryType.BREAK_START) {
      throw new BadRequestException("Cannot clock out during break");
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId: employee.id,
        type: TimeEntryType.CLOCK_OUT,
        timestamp: new Date(),
        source: TimeEntrySource.WEB,
      },
    });
  }

  async list(organizationId: string, filters: ListEntriesDto) {
    const where: {
      organizationId: string;
      employeeId?: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      organizationId,
    };

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) {
        where.timestamp.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.timestamp.lte = new Date(filters.to);
      }
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: { employee: true },
      orderBy: { timestamp: "desc" },
    });
  }

  async manual(organizationId: string, role: MembershipRole, data: ManualEntryDto) {
    this.ensureManager(role);

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId },
    });
    if (!employee) {
      throw new BadRequestException("Employee not found in organization");
    }

    const timestamp = new Date(data.timestamp);
    const lastEntry = await this.prisma.timeEntry.findFirst({
      where: { employeeId: employee.id, organizationId },
      orderBy: { timestamp: "desc" },
    });

    if (data.type === TimeEntryType.CLOCK_IN && lastEntry && lastEntry.type !== TimeEntryType.CLOCK_OUT) {
      throw new BadRequestException("Employee is already clocked in");
    }

    if (
      data.type === TimeEntryType.CLOCK_OUT &&
      (!lastEntry || lastEntry.type === TimeEntryType.CLOCK_OUT)
    ) {
      throw new BadRequestException("Cannot clock out without an open shift");
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId: employee.id,
        type: data.type,
        timestamp,
        source: data.source ?? TimeEntrySource.WEB,
      },
    });
  }

  private ensureManager(role: MembershipRole) {
    if (role === MembershipRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }

  private async findEmployeeForUser(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { user: { select: { email: true } } },
    });
    if (!membership?.user.email) {
      return null;
    }

    return this.prisma.employee.findFirst({
      where: { email: membership.user.email, organizationId, active: true },
    });
  }
}
