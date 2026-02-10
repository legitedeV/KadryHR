import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus, RcpEventType } from '@prisma/client';
import * as XLSX from 'xlsx';

export type ReportType = 'work-time' | 'absences';
export type ReportFormat = 'csv' | 'xlsx';

export type ReportExportListItem = {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  rowCount: number;
  filters: Record<string, string | null>;
  createdAt: Date;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MS_PER_HOUR = 1000 * 60 * 60;
  private readonly MAX_EXPORT_ROWS_SYNC = 5000;

  normalizeDateRange(from?: string, to?: string) {
    if (!from || !to) {
      throw new BadRequestException('Parametry from i to są wymagane');
    }

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Nieprawidłowy zakres dat');
    }

    if (fromDate > toDate) {
      throw new BadRequestException(
        'Data od nie może być późniejsza niż data do',
      );
    }

    return { fromDate, toDate };
  }

  async getWorkTimeReport(
    organisationId: string,
    from: Date,
    to: Date,
    filters: { locationId?: string; employeeId?: string },
  ) {
    const events = await this.prisma.rcpEvent.findMany({
      where: {
        organisationId,
        happenedAt: { gte: from, lte: to },
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.employeeId ? { userId: filters.employeeId } : {}),
      },
      include: {
        user: {
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
      orderBy: { happenedAt: 'asc' },
    });

    const grouped = new Map<string, typeof events>();
    for (const event of events) {
      const day = event.happenedAt.toISOString().slice(0, 10);
      const key = `${event.userId}:${event.locationId}:${day}`;
      const current = grouped.get(key) ?? [];
      current.push(event);
      grouped.set(key, current);
    }

    const rows: Array<{
      employeeId: string;
      employeeName: string;
      locationId: string;
      locationName: string;
      date: string;
      firstClockIn: string | null;
      lastClockOut: string | null;
      totalHours: number;
      entries: number;
    }> = [];

    grouped.forEach((groupEvents) => {
      let totalMs = 0;
      let currentIn: Date | null = null;

      for (const event of groupEvents) {
        if (event.type === RcpEventType.CLOCK_IN) {
          currentIn = event.happenedAt;
          continue;
        }

        if (event.type === RcpEventType.CLOCK_OUT && currentIn) {
          totalMs += Math.max(
            event.happenedAt.getTime() - currentIn.getTime(),
            0,
          );
          currentIn = null;
        }
      }

      const firstIn = groupEvents.find(
        (event) => event.type === RcpEventType.CLOCK_IN,
      );
      const reversed = [...groupEvents].reverse();
      const lastOut = reversed.find(
        (event) => event.type === RcpEventType.CLOCK_OUT,
      );
      const ref = groupEvents[0];

      rows.push({
        employeeId: ref.user.id,
        employeeName:
          `${ref.user.firstName ?? ''} ${ref.user.lastName ?? ''}`.trim() ||
          ref.user.email,
        locationId: ref.location.id,
        locationName: ref.location.name,
        date: ref.happenedAt.toISOString().slice(0, 10),
        firstClockIn: firstIn ? firstIn.happenedAt.toISOString() : null,
        lastClockOut: lastOut ? lastOut.happenedAt.toISOString() : null,
        totalHours:
          Math.round((totalMs / this.MS_PER_HOUR + Number.EPSILON) * 100) / 100,
        entries: groupEvents.length,
      });
    });

    return rows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.employeeName.localeCompare(b.employeeName);
    });
  }

  async getAbsencesReport(
    organisationId: string,
    from: Date,
    to: Date,
    filters: { status?: LeaveStatus; employeeId?: string },
  ) {
    return this.prisma.leaveRequest.findMany({
      where: {
        organisationId,
        startDate: { lte: to },
        endDate: { gte: from },
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
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
        leaveType: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  ensureExportSize(rowsCount: number) {
    if (rowsCount > this.MAX_EXPORT_ROWS_SYNC) {
      throw new PayloadTooLargeException(
        `Eksport zbyt duży (${rowsCount} rekordów). Maksymalnie ${this.MAX_EXPORT_ROWS_SYNC}.`,
      );
    }
  }

  async createExportMetadata(params: {
    organisationId: string;
    userId: string;
    reportType: ReportType;
    format: ReportFormat;
    rowCount: number;
    filters: Record<string, string | null>;
  }) {
    return this.prisma.reportExport.create({
      data: {
        organisationId: params.organisationId,
        createdByUserId: params.userId,
        reportType: params.reportType,
        format: params.format,
        rowCount: params.rowCount,
        filters: params.filters,
      },
    });
  }

  async getRecentExports(
    organisationId: string,
  ): Promise<ReportExportListItem[]> {
    const exports = await this.prisma.reportExport.findMany({
      where: { organisationId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return exports.map((item) => ({
      id: item.id,
      reportType: item.reportType as ReportType,
      format: item.format as ReportFormat,
      rowCount: item.rowCount,
      filters: (item.filters as Record<string, string | null>) ?? {},
      createdAt: item.createdAt,
      createdBy: item.createdBy,
    }));
  }

  convertToCSV(
    data: Array<Record<string, unknown>>,
    headers: string[],
  ): string {
    if (!data || data.length === 0) {
      return `${headers.join(',')}\n`;
    }

    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        let escaped = String(value);
        if (escaped.match(/^[=+\-@]/)) {
          escaped = `'${escaped}`;
        }
        escaped = escaped.replace(/\r?\n/g, ' ');
        if (escaped.includes(',') || escaped.includes('"')) {
          escaped = `"${escaped.replace(/"/g, '""')}"`;
        }
        return escaped;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  convertToXlsxBuffer(
    data: Array<Record<string, unknown>>,
    headers: string[],
  ): Buffer {
    const worksheetData = [
      headers,
      ...data.map((row) => headers.map((header) => row[header] ?? '')),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Raport');

    const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.isBuffer(output) ? output : Buffer.from(output);
  }
}
