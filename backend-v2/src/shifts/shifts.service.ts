import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateChronology(startsAt: Date, endsAt: Date) {
    if (startsAt >= endsAt) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
  }

  create(organisationId: string, dto: CreateShiftDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.validateChronology(startsAt, endsAt);

    return this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt,
        endsAt,
      },
    });
  }

  findAll(organisationId: string) {
    return this.prisma.shift.findMany({
      where: { organisationId },
      include: {
        employee: true,
        location: true,
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async update(organisationId: string, shiftId: string, dto: UpdateShiftDto) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });
    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    const nextStartsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : existing.startsAt;
    const nextEndsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;

    if (dto.startsAt || dto.endsAt) {
      this.validateChronology(nextStartsAt, nextEndsAt);
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt: dto.startsAt ? nextStartsAt : undefined,
        endsAt: dto.endsAt ? nextEndsAt : undefined,
      },
    });
  }

  async remove(organisationId: string, shiftId: string) {
    const existing = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.shift.delete({ where: { id: shiftId } });
    return { success: true };
  }
}
