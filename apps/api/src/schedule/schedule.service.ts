import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSchedule(month: string, orgId: string) {
    const normalizedMonth = this.normalizeMonth(month);

    let schedule = await this.prisma.schedule.findFirst({
      where: { orgId, month: normalizedMonth },
    });

    if (!schedule) {
      schedule = await this.prisma.schedule.create({
        data: {
          orgId,
          month: normalizedMonth,
          status: ScheduleStatus.DRAFT,
        },
      });
    }

    return schedule;
  }

  async listAssignments(month: string, orgId: string) {
    const schedule = await this.getOrCreateSchedule(month, orgId);

    const assignments = await this.prisma.shiftAssignment.findMany({
      where: { scheduleId: schedule.id },
      orderBy: { date: 'asc' },
    });

    return { schedule, assignments };
  }

  async createAssignment(
    month: string,
    orgId: string,
    dto: CreateAssignmentDto,
  ) {
    const schedule = await this.getOrCreateSchedule(month, orgId);
    await this.ensureEmployeeBelongsToOrg(dto.employeeId, orgId);
    this.validateDate(dto.date, schedule.month);
    this.validateTimeOrder(dto.start, dto.end);

    const assignment = await this.prisma.shiftAssignment.create({
      data: {
        scheduleId: schedule.id,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        start: dto.start,
        end: dto.end,
        type: dto.type,
        note: dto.note,
      },
    });

    return assignment;
  }

  async updateAssignment(id: string, orgId: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!assignment || assignment.schedule.orgId !== orgId) {
      throw new NotFoundException('Assignment not found');
    }

    if (dto.employeeId) {
      await this.ensureEmployeeBelongsToOrg(dto.employeeId, orgId);
    }

    const newDate = dto.date ? new Date(dto.date) : assignment.date;
    const newStart = dto.start ?? assignment.start;
    const newEnd = dto.end ?? assignment.end;
    const newType = dto.type ?? assignment.type;
    const newNote = dto.note ?? assignment.note;
    const employeeId = dto.employeeId ?? assignment.employeeId;

    this.validateDate(newDate.toISOString(), assignment.schedule.month);
    this.validateTimeOrder(newStart, newEnd);

    const updated = await this.prisma.shiftAssignment.update({
      where: { id },
      data: {
        employeeId,
        date: newDate,
        start: newStart,
        end: newEnd,
        type: newType,
        note: newNote,
      },
    });

    return updated;
  }

  async deleteAssignment(id: string, orgId: string): Promise<void> {
    const assignment = await this.prisma.shiftAssignment.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!assignment || assignment.schedule.orgId !== orgId) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.shiftAssignment.delete({ where: { id } });
  }

  async publish(month: string, orgId: string) {
    const schedule = await this.getOrCreateSchedule(month, orgId);

    if (schedule.status === ScheduleStatus.PUBLISHED) {
      return schedule;
    }

    return this.prisma.schedule.update({
      where: { id: schedule.id },
      data: { status: ScheduleStatus.PUBLISHED },
    });
  }

  async unpublish(month: string, orgId: string) {
    const schedule = await this.getOrCreateSchedule(month, orgId);

    if (schedule.status === ScheduleStatus.DRAFT) {
      return schedule;
    }

    return this.prisma.schedule.update({
      where: { id: schedule.id },
      data: { status: ScheduleStatus.DRAFT },
    });
  }

  private async ensureEmployeeBelongsToOrg(
    employeeId: string,
    orgId: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, orgId },
    });

    if (!employee) {
      throw new BadRequestException('Employee does not belong to this organization');
    }
  }

  private validateTimeOrder(start: string, end: string) {
    const startMinutes = this.parseTimeToMinutes(start);
    const endMinutes = this.parseTimeToMinutes(end);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('Shift end time must be after start time');
    }
  }

  private validateDate(date: string, month: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }

    const [year, monthPart] = this.normalizeMonth(month).split('-');

    if (
      parsedDate.getUTCFullYear() !== Number(year) ||
      parsedDate.getUTCMonth() + 1 !== Number(monthPart)
    ) {
      throw new BadRequestException('Date must be within the schedule month');
    }
  }

  private normalizeMonth(month: string): string {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    return month;
  }

  private parseTimeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException('Invalid time format');
    }

    return hours * 60 + minutes;
  }
}
