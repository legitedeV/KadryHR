import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MS_PER_HOUR = 1000 * 60 * 60;
  private readonly NO_LOCATION_LABEL = 'Bez lokalizacji';

  /**
   * Get schedule summary for date range
   */
  async getScheduleSummary(
    organisationId: string,
    from: Date,
    to: Date,
    locationId?: string,
  ) {
    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        startsAt: {
          gte: from,
          lte: to,
        },
        ...(locationId ? { locationId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return shifts;
  }

  getShiftDurationHours(startsAt: Date, endsAt: Date) {
    const diff =
      (endsAt.getTime() - startsAt.getTime()) / this.MS_PER_HOUR;
    return Math.round((Math.max(diff, 0) + Number.EPSILON) * 100) / 100;
  }

  async getHoursSummary(
    organisationId: string,
    from: Date,
    to: Date,
    locationId?: string,
  ) {
    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        startsAt: {
          gte: from,
          lte: to,
        },
        ...(locationId ? { locationId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totals = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        locationId: string | null;
        locationName: string;
        hours: number;
        shiftCount: number;
      }
    >();

    for (const shift of shifts) {
      if (!shift.employeeId) continue;
      const locationName = shift.location?.name ?? this.NO_LOCATION_LABEL;
      const key = `${shift.employeeId}:${shift.locationId ?? 'none'}`;
      const current = totals.get(key) ?? {
        employeeId: shift.employeeId,
        employeeName:
          `${shift.employee?.firstName ?? ''} ${shift.employee?.lastName ?? ''}`.trim() ||
          shift.employee?.email ||
          'Pracownik',
        locationId: shift.locationId ?? null,
        locationName,
        hours: 0,
        shiftCount: 0,
      };

      current.hours += this.getShiftDurationHours(shift.startsAt, shift.endsAt);
      current.shiftCount += 1;
      totals.set(key, current);
    }

    return Array.from(totals.values()).map((row) => ({
      ...row,
      hours: Math.round((row.hours + Number.EPSILON) * 100) / 100,
    }));
  }

  /**
   * Get leave requests summary for date range
   */
  async getLeavesSummary(organisationId: string, from: Date, to: Date) {
    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        organisationId,
        startDate: {
          lte: to,
        },
        endDate: {
          gte: from,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return leaveRequests;
  }

  /**
   * Convert data to CSV format with proper escaping to prevent CSV injection
   */
  convertToCSV(data: any[], headers: string[]): string {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }

    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Convert to string
        let escaped = String(value);

        // Prevent CSV injection by prefixing dangerous characters
        if (escaped.match(/^[=+\-@]/)) {
          escaped = "'" + escaped;
        }

        // Replace newlines and carriage returns with spaces
        escaped = escaped.replace(/\r?\n/g, ' ');

        // Escape quotes and wrap in quotes if contains comma, quotes, or was modified
        if (
          escaped.includes(',') ||
          escaped.includes('"') ||
          value !== escaped
        ) {
          escaped = '"' + escaped.replace(/"/g, '""') + '"';
        }

        return escaped;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
