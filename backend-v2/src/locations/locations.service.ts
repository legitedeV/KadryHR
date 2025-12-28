import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({
      data: {
        ...dto,
        organisationId,
      },
    });
  }

  findAll(organisationId: string) {
    return this.prisma.location.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    organisationId: string,
    locationId: string,
    dto: UpdateLocationDto,
  ) {
    const existing = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: dto,
    });
  }

  async remove(organisationId: string, locationId: string) {
    const existing = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    await this.prisma.location.delete({ where: { id: locationId } });
    return { success: true };
  }
}
