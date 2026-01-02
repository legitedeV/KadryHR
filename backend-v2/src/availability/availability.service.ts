import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { QueryAvailabilityDto } from './dto/query-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private validateRange(startMinutes: number, endMinutes: number) {
    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        'startMinutes must be less than endMinutes',
      );
    }
  }

  async create(organisationId: string, dto: CreateAvailabilityDto) {
    this.validateRange(dto.startMinutes, dto.endMinutes);

    return this.prisma.availability.create({
      data: {
        organisationId,
        employeeId: dto.employeeId,
        date: dto.date ? new Date(dto.date) : undefined,
        weekday: dto.weekday,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        notes: dto.notes,
      },
    });
  }

  findAll(organisationId: string, query: QueryAvailabilityDto) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.from) {
      const from = new Date(query.from);
      from.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = from;
    }
    if (query.to) {
      const to = new Date(query.to);
      to.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }

    const where: Parameters<
      typeof this.prisma.availability.findMany
    >[0]['where'] = {
      organisationId,
      employeeId: query.employeeId,
    };

    if (query.from || query.to) {
      where.AND = [
        {
          OR: [{ date: dateFilter }, { weekday: { not: null } }],
        },
      ];
    }

    return this.prisma.availability.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    organisationId: string,
    availabilityId: string,
    dto: UpdateAvailabilityDto,
  ) {
    const existing = await this.prisma.availability.findFirst({
      where: { id: availabilityId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    if (dto.startMinutes != null && dto.endMinutes != null) {
      this.validateRange(dto.startMinutes, dto.endMinutes);
    }

    return this.prisma.availability.update({
      where: { id: availabilityId },
      data: {
        employeeId: dto.employeeId,
        date: dto.date ? new Date(dto.date) : undefined,
        weekday: dto.weekday,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        notes: dto.notes,
      },
    });
  }

  async remove(organisationId: string, availabilityId: string) {
    const existing = await this.prisma.availability.findFirst({
      where: { id: availabilityId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Availability not found');
    }

    await this.prisma.availability.delete({ where: { id: availabilityId } });
    return { success: true };
  }
}
