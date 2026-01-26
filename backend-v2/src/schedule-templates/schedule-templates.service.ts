import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Weekday } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleTemplateFromWeekDto } from './dto/create-schedule-template-from-week.dto';

function toWeekday(date: Date): Weekday {
  const day = date.getDay();
  switch (day) {
    case 1:
      return Weekday.MONDAY;
    case 2:
      return Weekday.TUESDAY;
    case 3:
      return Weekday.WEDNESDAY;
    case 4:
      return Weekday.THURSDAY;
    case 5:
      return Weekday.FRIDAY;
    case 6:
      return Weekday.SATURDAY;
    default:
      return Weekday.SUNDAY;
  }
}

function minutesFromStartOfDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - startOfDay.getTime()) / 60000);
}

@Injectable()
export class ScheduleTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(organisationId: string) {
    return this.prisma.scheduleTemplate.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { shifts: true } },
      },
    });
  }

  async getTemplate(organisationId: string, id: string) {
    const template = await this.prisma.scheduleTemplate.findFirst({
      where: { id, organisationId },
      include: {
        shifts: {
          orderBy: { startMinutes: 'asc' },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Schedule template not found');
    }

    return template;
  }

  async createFromWeek(
    organisationId: string,
    dto: CreateScheduleTemplateFromWeekDto,
    createdById?: string,
  ) {
    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('Invalid date range');
    }

    if (dto.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: dto.locationId, organisationId },
      });
      if (!location) {
        throw new BadRequestException('Invalid location');
      }
    }

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        startsAt: { gte: from },
        endsAt: { lte: to },
        ...(dto.locationId ? { locationId: dto.locationId } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });

    if (!shifts.length) {
      throw new BadRequestException('Brak zmian w wybranym tygodniu');
    }

    const shiftData = shifts.map((shift) => {
      const startMinutes = minutesFromStartOfDay(shift.startsAt);
      const endMinutes = minutesFromStartOfDay(shift.endsAt);
      return {
        employeeId: shift.employeeId,
        locationId: shift.locationId,
        position: shift.position,
        notes: shift.notes,
        color: shift.color,
        weekday: toWeekday(shift.startsAt),
        startMinutes,
        endMinutes,
      };
    });

    const template = await this.prisma.scheduleTemplate.create({
      data: {
        organisationId,
        name: dto.name,
        description: dto.description ?? null,
        createdById: createdById ?? null,
        shifts: {
          createMany: { data: shiftData },
        },
      },
      include: {
        _count: { select: { shifts: true } },
      },
    });

    return template;
  }
}
