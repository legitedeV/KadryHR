import { Injectable } from '@nestjs/common';
import { LeaveStatus, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleService } from '../schedule/schedule.service';

type DashboardNotification = {
  id: string;
  category: 'schedule' | 'leave' | 'availability' | 'system';
  title: string;
  description: string;
  createdAt: string;
  unread?: boolean;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async getOverview(orgId: string) {
    const now = new Date();
    const today = this.startOfDay(now);
    const weekAhead = this.addDays(today, 7);
    const monthKey = this.toMonthKey(today);

    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { employees: true },
    });

    const employees = organization?.employees ?? [];
    const activeEmployees = employees.filter((employee) => employee.active);
    const activeEmployeesCount = activeEmployees.length;

    const schedule = await this.scheduleService.getOrCreateSchedule(monthKey, orgId);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { date: 'asc' },
    });

    const upcomingAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        schedule: { orgId },
        date: { gte: today, lt: this.addDays(today, 30) },
      },
      include: { employee: true, schedule: true },
      orderBy: { date: 'asc' },
    });

    const [pendingLeaves, upcomingLeaves] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: { orgId, status: LeaveStatus.PENDING },
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          orgId,
          status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
          startDate: { gte: today, lt: this.addDays(today, 30) },
        },
        include: { employee: true },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const leaveSummaries = upcomingLeaves.slice(0, 6).map((leave) => ({
      id: leave.id,
      employeeName: leave.employee?.name || 'Pracownik',
      date: leave.startDate.toISOString(),
      type: leave.type,
      status: leave.status,
      note: leave.reason,
    }));

    const publishedSchedules = await this.prisma.schedule.count({
      where: { orgId, status: ScheduleStatus.PUBLISHED },
    });

    const futureShifts = assignments.filter((assignment) =>
      assignment.date.getTime() >= today.getTime(),
    );

    const nextShifts = futureShifts.slice(0, 5).map((assignment) => ({
      id: assignment.id,
      employeeName: employees.find((employee) => employee.id === assignment.employeeId)?.name || 'Pracownik',
      date: assignment.date.toISOString(),
      start: assignment.start,
      end: assignment.end,
      type: assignment.type,
    }));

    const availabilityWindow = await this.prisma.shiftAssignment.findMany({
      where: {
        schedule: { orgId },
        date: { gte: today, lt: weekAhead },
      },
      include: { employee: true },
      orderBy: { date: 'asc' },
    });

    const availabilityByDay = this.buildAvailability(availabilityWindow, activeEmployeesCount, today, weekAhead);
    const scheduledEmployeeIds = new Set(availabilityWindow.map((assignment) => assignment.employeeId));

    const notifications = this.buildNotifications({
      schedule,
      leaveSummaries,
      hasAvailabilityGaps: availabilityByDay.some((day) => day.openSpots > 0),
    });

    const unreadNotifications = notifications.filter((item) => item.unread).length;

    return {
      meta: {
        organization: {
          id: organization?.id ?? orgId,
          name: organization?.name ?? 'Organizacja',
        },
        asOf: now.toISOString(),
        window: {
          start: today.toISOString(),
          end: weekAhead.toISOString(),
        },
      },
      stats: {
        activeEmployees: activeEmployeesCount,
        publishedSchedules,
        pendingLeaves: pendingLeaves.length,
        upcomingShifts: futureShifts.length,
        unreadNotifications,
        coverageRatio: activeEmployeesCount
          ? Math.round((scheduledEmployeeIds.size / activeEmployeesCount) * 100)
          : 0,
      },
      schedule: {
        month: schedule.month,
        status: schedule.status,
        assignments: assignments.length,
        publishedSchedules,
        upcoming: nextShifts,
      },
      leaves: {
        pendingCount: pendingLeaves.length,
        upcoming: leaveSummaries,
      },
      notifications: {
        unread: unreadNotifications,
        items: notifications,
      },
      availability: {
        activeEmployees: activeEmployeesCount,
        scheduledEmployees: scheduledEmployeeIds.size,
        coverageRatio: activeEmployeesCount
          ? Math.round((scheduledEmployeeIds.size / activeEmployeesCount) * 100)
          : 0,
        days: availabilityByDay,
      },
    };
  }

  private buildAvailability(
    assignments: { date: Date; employeeId: string | null }[],
    activeEmployees: number,
    start: Date,
    end: Date,
  ) {
    const days: { date: string; scheduledCount: number; openSpots: number }[] = [];
    const cursor = new Date(start);

    while (cursor.getTime() < end.getTime()) {
      const dayKey = cursor.toISOString().split('T')[0];
      const scheduledCount = assignments.filter((assignment) =>
        assignment.date.toISOString().startsWith(dayKey),
      ).length;
      const openSpots = Math.max(activeEmployees - scheduledCount, 0);
      days.push({ date: new Date(cursor).toISOString(), scheduledCount, openSpots });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
  }

  private buildNotifications(params: {
    schedule: { status: ScheduleStatus; month: string };
    leaveSummaries: { id: string; employeeName: string; date: string; type: string }[];
    hasAvailabilityGaps: boolean;
  }): DashboardNotification[] {
    const items: DashboardNotification[] = [
      {
        id: 'notif-schedule',
        category: 'schedule',
        title:
          params.schedule.status === ScheduleStatus.PUBLISHED
            ? 'Grafik opublikowany'
            : 'Grafik w wersji roboczej',
        description:
          params.schedule.status === ScheduleStatus.PUBLISHED
            ? `Miesiąc ${params.schedule.month} jest opublikowany. Pamiętaj o aktualizacjach zmian.`
            : `Grafik ${params.schedule.month} jest w wersji roboczej. Opublikuj go po wprowadzeniu zmian.`,
        createdAt: new Date().toISOString(),
        unread: params.schedule.status !== ScheduleStatus.PUBLISHED,
      },
    ];

    if (params.leaveSummaries.length) {
      items.push({
        id: 'notif-leave',
        category: 'leave',
        title: `${params.leaveSummaries.length} nadchodzących urlopów`,
        description: `${params.leaveSummaries
          .slice(0, 3)
          .map((leave) => leave.employeeName)
          .join(', ')} zaplanowało nieobecności.`,
        createdAt: new Date().toISOString(),
        unread: true,
      });
    }

    if (params.hasAvailabilityGaps) {
      items.push({
        id: 'notif-availability',
        category: 'availability',
        title: 'Uzupełnij dostępność zespołu',
        description: 'Brakuje osób na części zmian w nadchodzącym tygodniu.',
        createdAt: new Date().toISOString(),
        unread: true,
      });
    }

    return items;
  }

  private toMonthKey(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private startOfDay(date: Date) {
    const clone = new Date(date);
    clone.setUTCHours(0, 0, 0, 0);
    return clone;
  }

  private addDays(date: Date, days: number) {
    const clone = new Date(date);
    clone.setUTCDate(clone.getUTCDate() + days);
    return clone;
  }
}
