import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { UpdateShiftDto } from "./dto/update-shift.dto";
import { ListShiftsDto } from "./dto/list-shifts.dto";

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, filters: ListShiftsDto) {
    const where: { organizationId: string; start?: { gte?: Date; lte?: Date }; locationId?: string } = {
      organizationId,
    };

    if (filters.from || filters.to) {
      where.start = {};
      if (filters.from) {
        where.start.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.start.lte = new Date(filters.to);
      }
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    return this.prisma.shift.findMany({
      where,
      include: {
        employee: true,
        location: true,
      },
      orderBy: { start: "asc" },
    });
  }

  async create(organizationId: string, data: CreateShiftDto) {
    const [employee, location] = await Promise.all([
      this.prisma.employee.findFirst({ where: { id: data.employeeId, organizationId } }),
      this.prisma.location.findFirst({ where: { id: data.locationId, organizationId } }),
    ]);

    if (!employee || !location) {
      throw new BadRequestException("Employee or location not found in organization");
    }

    return this.prisma.shift.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        start: new Date(data.start),
        end: new Date(data.end),
        published: data.published ?? false,
        status: data.status ?? null,
      },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: UpdateShiftDto) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId },
    });
    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    if (data.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: data.employeeId, organizationId },
      });
      if (!employee) {
        throw new BadRequestException("Employee not found in organization");
      }
    }

    if (data.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: data.locationId, organizationId },
      });
      if (!location) {
        throw new BadRequestException("Location not found in organization");
      }
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        employeeId: data.employeeId ?? undefined,
        locationId: data.locationId ?? undefined,
        start: data.start ? new Date(data.start) : undefined,
        end: data.end ? new Date(data.end) : undefined,
        published: data.published ?? undefined,
        status: data.status ?? undefined,
      },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, organizationId },
    });
    if (!shift) {
      throw new NotFoundException("Shift not found");
    }

    await this.prisma.shift.delete({ where: { id } });
    return { success: true };
  }
}
