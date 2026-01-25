import { Injectable } from "@nestjs/common";
import { TimeEntryType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TimesheetQueryDto } from "./dto/timesheet-query.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async timesheets(organizationId: string, query: TimesheetQueryDto) {
    const where: {
      organizationId: string;
      employeeId?: string;
      timestamp?: { gte?: Date; lte?: Date };
      type?: { in: TimeEntryType[] };
    } = {
      organizationId,
      type: { in: [TimeEntryType.CLOCK_IN, TimeEntryType.CLOCK_OUT] },
    };

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) {
        where.timestamp.gte = new Date(query.from);
      }
      if (query.to) {
        where.timestamp.lte = new Date(query.to);
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: { employee: true },
      orderBy: [{ employeeId: "asc" }, { timestamp: "asc" }],
    });

    if (entries.length === 0) {
      return {
        totalHours: 0,
        totalEntries: 0,
        entries: [],
      };
    }

    const mapped: Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      clockIn: Date;
      clockOut: Date;
      durationHours: number;
    }> = [];

    const openClockIn: Record<string, { id: string; timestamp: Date } | null> = {};

    for (const entry of entries) {
      if (!openClockIn[entry.employeeId]) {
        openClockIn[entry.employeeId] = null;
      }

      if (entry.type === TimeEntryType.CLOCK_IN) {
        openClockIn[entry.employeeId] = { id: entry.id, timestamp: entry.timestamp };
        continue;
      }

      if (entry.type === TimeEntryType.CLOCK_OUT) {
        const start = openClockIn[entry.employeeId];
        if (!start) {
          continue;
        }
        const durationMs = entry.timestamp.getTime() - start.timestamp.getTime();
        mapped.push({
          id: entry.id,
          employeeId: entry.employeeId,
          employeeName: `${entry.employee.firstName} ${entry.employee.lastName}`,
          clockIn: start.timestamp,
          clockOut: entry.timestamp,
          durationHours: Math.max(durationMs / 1000 / 60 / 60, 0),
        });
        openClockIn[entry.employeeId] = null;
      }
    }

    const totalHours = mapped.reduce((sum, entry) => sum + entry.durationHours, 0);

    return {
      totalHours,
      totalEntries: mapped.length,
      entries: mapped,
    };
  }
}
