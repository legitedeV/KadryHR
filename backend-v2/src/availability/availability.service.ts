import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista dostępności w ramach organizacji.
   */
  findAll(organisationId: string) {
    return this.prisma.availability.findMany({
      where: { organisationId },
      orderBy: [{ date: 'asc' }, { weekday: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /**
   * Tworzenie rekordu dostępności.
   */
  async create(organisationId: string, dto: any) {
    if (
      typeof dto.startMinutes === 'number' &&
      typeof dto.endMinutes === 'number' &&
      dto.endMinutes <= dto.startMinutes
    ) {
      throw new BadRequestException(
        'endMinutes must be greater than startMinutes',
      );
    }
    return this.prisma.availability.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        date: dto.date ?? null,
        weekday: dto.weekday ?? null,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        notes: dto.notes ?? null,
      },
    });
  }

  /**
   * Aktualizacja rekordu dostępności z kontrolą organizacji.
   */
  async update(organisationId: string, id: string, dto: any) {
    const existing = await this.prisma.availability.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    return this.prisma.availability.update({
      where: { id },
      data: {
        employeeId: dto.employeeId ?? existing.employeeId,
        date: dto.date ?? existing.date,
        weekday: dto.weekday ?? existing.weekday,
        startMinutes:
          typeof dto.startMinutes === 'number'
            ? dto.startMinutes
            : existing.startMinutes,
        endMinutes:
          typeof dto.endMinutes === 'number'
            ? dto.endMinutes
            : existing.endMinutes,
        notes: dto.notes ?? existing.notes,
      },
    });
  }

  /**
   * Usunięcie rekordu dostępności w ramach organizacji.
   */
  async remove(organisationId: string, id: string) {
    const existing = await this.prisma.availability.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    await this.prisma.availability.delete({
      where: { id },
    });

    return { success: true };
  }
}
