import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wszystkie zmiany w organizacji (dla OWNER/MANAGER).
   */
  findAll(organisationId: string) {
    return this.prisma.shift.findMany({
      where: { organisationId },
      orderBy: { startsAt: 'asc' },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  /**
   * Zmiany dla konkretnego pracownika (EMPLOYEE view).
   */
  findForEmployee(organisationId: string, employeeId: string) {
    return this.prisma.shift.findMany({
      where: { organisationId, employeeId },
      orderBy: { startsAt: 'asc' },
      include: {
        employee: true,
        location: true,
      },
    });
  }

  /**
   * Tworzenie zmiany.
   */
  create(organisationId: string, dto: any) {
    return this.prisma.shift.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        locationId: dto.locationId ?? null,
        position: dto.position ?? null,
        notes: dto.notes ?? null,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
      },
    });
  }

  /**
   * Aktualizacja zmiany z kontrolą organisationId.
   */
  async update(organisationId: string, id: string, dto: any) {
    const existing = await this.prisma.shift.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        employeeId: dto.employeeId ?? existing.employeeId,
        locationId:
          dto.locationId !== undefined ? dto.locationId : existing.locationId,
        position: dto.position ?? existing.position,
        notes: dto.notes ?? existing.notes,
        startsAt: dto.startsAt ?? existing.startsAt,
        endsAt: dto.endsAt ?? existing.endsAt,
      },
    });
  }

  /**
   * Usunięcie zmiany z kontrolą organisationId.
   */
  async remove(organisationId: string, id: string) {
    const existing = await this.prisma.shift.findFirst({
      where: { id, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.shift.delete({
      where: { id },
    });

    return { success: true };
  }
}
