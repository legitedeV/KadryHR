import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListEntriesDto } from "./dto/list-entries.dto";
import { ManualEntryDto } from "./dto/manual-entry.dto";

@Injectable()
export class RcpService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(userId: string, organizationId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, organizationId },
    });
    if (!employee) {
      throw new BadRequestException("No employee linked to this user");
    }

    const existing = await this.prisma.timeEntry.findFirst({
      where: { employeeId: employee.id, organizationId, clockOut: null },
    });
    if (existing) {
      throw new BadRequestException("Open time entry already exists");
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId: employee.id,
        clockIn: new Date(),
        source: "web-panel",
      },
    });
  }

  async clockOut(userId: string, organizationId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, organizationId },
    });
    if (!employee) {
      throw new BadRequestException("No employee linked to this user");
    }

    const entry = await this.prisma.timeEntry.findFirst({
      where: { employeeId: employee.id, organizationId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
    if (!entry) {
      throw new NotFoundException("No open time entry");
    }

    return this.prisma.timeEntry.update({
      where: { id: entry.id },
      data: { clockOut: new Date() },
    });
  }

  async list(organizationId: string, filters: ListEntriesDto) {
    const where: {
      organizationId: string;
      employeeId?: string;
      clockIn?: { gte?: Date; lte?: Date };
    } = {
      organizationId,
    };

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.from || filters.to) {
      where.clockIn = {};
      if (filters.from) {
        where.clockIn.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.clockIn.lte = new Date(filters.to);
      }
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: { employee: true },
      orderBy: { clockIn: "desc" },
    });
  }

  async manual(organizationId: string, role: UserRole, data: ManualEntryDto) {
    this.ensureManager(role);

    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId },
    });
    if (!employee) {
      throw new BadRequestException("Employee not found in organization");
    }

    const clockIn = new Date(data.clockIn);
    const clockOut = data.clockOut ? new Date(data.clockOut) : null;

    if (clockOut && clockOut <= clockIn) {
      throw new BadRequestException("Clock-out must be after clock-in");
    }

    if (!clockOut) {
      const existing = await this.prisma.timeEntry.findFirst({
        where: { employeeId: employee.id, organizationId, clockOut: null },
      });
      if (existing) {
        throw new BadRequestException("Open time entry already exists");
      }
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        employeeId: employee.id,
        clockIn,
        clockOut,
        source: "manual",
      },
    });
  }

  private ensureManager(role: UserRole) {
    if (role === UserRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
