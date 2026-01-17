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
        date: {
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
   * Convert data to CSV format
   */
  convertToCSV(data: any[], headers: string[]): string {
    if (!data || data.length === 0) {
      return headers.join(',') + '\n';
    }

    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma or quotes
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
