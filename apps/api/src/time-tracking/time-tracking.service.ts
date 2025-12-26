import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Employee, TimeEntry, TimeEntryEvent, TimeEntrySource } from '@prisma/client';
import * as QRCode from 'qrcode';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { RecordEventDto } from './dto/record-event.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { PrismaService } from '../prisma/prisma.service';

const WORKING_STATES: Record<TimeEntryEvent, 'working' | 'on_break' | 'clocked_out'> = {
  CLOCK_IN: 'working',
  BREAK_END: 'working',
  BREAK_START: 'on_break',
  CLOCK_OUT: 'clocked_out',
  MANUAL: 'clocked_out',
};

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(orgId: string, dto: RecordEventDto, userId?: string) {
    const employee = await this.ensureEmployee(orgId, dto.employeeId);
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    const previousEvents = await this.prisma.timeEntry.findMany({
      where: { orgId, employeeId: employee.id },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    this.validateSequence(dto.event, previousEvents);

    const entry = await this.prisma.timeEntry.create({
      data: {
        orgId,
        employeeId: employee.id,
        recordedById: userId,
        event: dto.event,
        source: dto.source || TimeEntrySource.QUICK_ACTION,
        occurredAt,
        location: dto.location,
        note: dto.note,
      },
    });

    return {
      entry,
      status: this.computeStatus([entry, ...previousEvents]),
    };
  }

  async createManualEntry(orgId: string, dto: ManualEntryDto, userId?: string) {
    const employee = await this.ensureEmployee(orgId, dto.employeeId);
    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);

    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    if (endedAt <= startedAt) {
      throw new BadRequestException('End time must be after start time');
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        orgId,
        employeeId: employee.id,
        recordedById: userId,
        event: TimeEntryEvent.MANUAL,
        source: dto.source || TimeEntrySource.MANUAL,
        occurredAt: endedAt,
        manualStartedAt: startedAt,
        manualEndedAt: endedAt,
        location: dto.location,
        note: dto.note,
      },
    });

    const recent = await this.prisma.timeEntry.findMany({
      where: { orgId, employeeId: employee.id },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    return {
      entry,
      status: this.computeStatus(recent),
    };
  }

  async getStatus(orgId: string, employeeId: string) {
    const employee = await this.ensureEmployee(orgId, employeeId);
    const recent = await this.prisma.timeEntry.findMany({
      where: { orgId, employeeId: employee.id },
      include: { recordedBy: true },
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });

    const status = this.computeStatus(recent);
    return {
      employee: { id: employee.id, name: employee.name },
      status,
      recent,
    };
  }

  async getRecentEvents(orgId: string, employeeId?: string, take = 20) {
    return this.prisma.timeEntry.findMany({
      where: { orgId, employeeId: employeeId || undefined },
      include: { employee: true, recordedBy: true },
      orderBy: { occurredAt: 'desc' },
      take,
    });
  }

  async buildReport(orgId: string, query: ReportQueryDto) {
    const days = query.days || 7;
    const rangeEnd = this.endOfDay(new Date());
    const rangeStart = this.startOfDay(this.addDays(rangeEnd, -(days - 1)));

    const events = await this.prisma.timeEntry.findMany({
      where: {
        orgId,
        employeeId: query.employeeId || undefined,
        occurredAt: { gte: rangeStart, lte: rangeEnd },
      },
      orderBy: { occurredAt: 'asc' },
    });

    const perDay = this.aggregateDurations(events, rangeStart, rangeEnd);
    const totalMinutes = Object.values(perDay).reduce((acc, minutes) => acc + minutes, 0);

    return {
      range: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
        days,
      },
      totals: {
        minutes: totalMinutes,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
      },
      daily: Object.entries(perDay).map(([date, minutes]) => ({ date, minutes })),
    };
  }

  async generateQr(orgId: string, dto: GenerateQrDto, userId?: string) {
    const payload = {
      orgId,
      location: dto.locationLabel,
      employeeId: dto.employeeId || null,
      note: dto.note || null,
      issuedAt: new Date().toISOString(),
      issuedBy: userId || null,
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const qrDataUrl = await QRCode.toDataURL(token, { width: 320, margin: 1 });

    return {
      token,
      payload,
      qrDataUrl,
    };
  }

  private computeStatus(events: TimeEntry[]) {
    if (!events.length) {
      return { state: 'clocked_out' as const, lastEvent: null, since: null };
    }

    const [latest] = events.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    const state = WORKING_STATES[latest.event] || 'clocked_out';

    return {
      state,
      lastEvent: latest,
      since: latest.occurredAt.toISOString(),
    } as const;
  }

  private validateSequence(nextEvent: TimeEntryEvent, history: TimeEntry[]) {
    const status = this.computeStatus(history);

    const isWorking = status.state === 'working';
    const isOnBreak = status.state === 'on_break';

    if (nextEvent === TimeEntryEvent.CLOCK_IN && (isWorking || isOnBreak)) {
      throw new BadRequestException('Pracownik jest już na zmianie');
    }

    if (nextEvent === TimeEntryEvent.CLOCK_OUT && !isWorking && !isOnBreak) {
      throw new BadRequestException('Brak aktywnej zmiany do zamknięcia');
    }

    if (nextEvent === TimeEntryEvent.BREAK_START && !isWorking) {
      throw new BadRequestException('Przerwa dostępna tylko w trakcie pracy');
    }

    if (nextEvent === TimeEntryEvent.BREAK_END && !isOnBreak) {
      throw new BadRequestException('Brak aktywnej przerwy');
    }
  }

  private aggregateDurations(events: TimeEntry[], rangeStart: Date, rangeEnd: Date) {
    const perDay: Record<string, number> = {};
    let activeStart: Date | null = null;

    const sorted = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    for (const event of sorted) {
      if (event.event === TimeEntryEvent.MANUAL && event.manualStartedAt && event.manualEndedAt) {
        this.addDuration(perDay, event.manualStartedAt, event.manualEndedAt);
        continue;
      }

      if (event.event === TimeEntryEvent.CLOCK_IN || event.event === TimeEntryEvent.BREAK_END) {
        activeStart = event.occurredAt;
      }

      if (event.event === TimeEntryEvent.BREAK_START || event.event === TimeEntryEvent.CLOCK_OUT) {
        if (activeStart) {
          this.addDuration(perDay, activeStart, event.occurredAt);
          activeStart = null;
        }
      }
    }

    const now = new Date();
    if (activeStart && activeStart <= rangeEnd) {
      const until = now < rangeEnd ? now : rangeEnd;
      this.addDuration(perDay, activeStart, until);
    }

    return perDay;
  }

  private addDuration(perDay: Record<string, number>, start: Date, end: Date) {
    if (end <= start) return;

    const cursor = new Date(start);
    while (cursor < end) {
      const dayKey = cursor.toISOString().split('T')[0];
      const dayEnd = this.endOfDay(cursor);
      const segmentEnd = end < dayEnd ? end : dayEnd;
      const minutes = Math.round((segmentEnd.getTime() - cursor.getTime()) / 60000);
      perDay[dayKey] = (perDay[dayKey] || 0) + minutes;
      cursor.setTime(segmentEnd.getTime());
      if (cursor < end) {
        cursor.setHours(0, 0, 0, 0);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }

  private startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private async ensureEmployee(orgId: string, employeeId: string): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, orgId } });
    if (!employee) {
      throw new NotFoundException('Employee not found in this organization');
    }
    return employee;
  }
}
