import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get schedule summary for date range
   */
  async getScheduleSummary(organisationId: string, from: Date, to: Date) {
    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        startsAt: {
          gte: from,
          lte: to,
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
