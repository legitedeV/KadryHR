import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TimesheetQueryDto } from "./dto/timesheet-query.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async timesheets(organizationId: string, query: TimesheetQueryDto) {
    const where: {
      organizationId: string;
      employeeId?: string;
      clockIn?: { gte?: Date; lte?: Date };
      clockOut?: { not: null };
    } = {
      organizationId,
      clockOut: { not: null },
    };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.from || query.to) {
      where.clockIn = {};
      if (query.from) {
        where.clockIn.gte = new Date(query.from);
      }
      if (query.to) {
        where.clockIn.lte = new Date(query.to);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: { employee: true },
    });

    if (entries.length === 0) {
      return {
        totalHours: 0,
        totalEntries: 0,
        entries: [],
      };
    }

    const mapped = entries.map((entry) => {
      if (!entry.clockOut) {
        throw new BadRequestException("All entries must have clockOut");
      }
      const durationMs = entry.clockOut.getTime() - entry.clockIn.getTime();
      return {
        id: entry.id,
        employeeId: entry.employeeId,
        employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        durationHours: Math.max(durationMs / 1000 / 60 / 60, 0),
      };
    });

    const totalHours = mapped.reduce((sum, entry) => sum + entry.durationHours, 0);

    return {
      totalHours,
      totalEntries: mapped.length,
      entries: mapped,
    };
  }
}
