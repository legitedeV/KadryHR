import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
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

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        employeeId: dto.employeeId,
        locationId: dto.locationId,
        position: dto.position,
        notes: dto.notes,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
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
