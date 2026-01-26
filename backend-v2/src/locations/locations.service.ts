import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

const locationInclude = {
  employees: {
    include: {
      employee: {
        include: {
          locations: {
            include: {
              location: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.LocationInclude;

type LocationWithEmployees = Prisma.LocationGetPayload<{
  include: typeof locationInclude;
}>;

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateLocationDto) {
    const { employeeIds = [] as string[], ...data } = dto;

    const validEmployeeIds = employeeIds.length
      ? await this.validateEmployeeIds(organisationId, employeeIds)
      : [];

    const created = await this.prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          ...data,
          organisationId,
        },
      });

      if (validEmployeeIds.length) {
        await this.setLocationEmployees(
          tx,
          organisationId,
          location.id,
          validEmployeeIds,
        );
      }

      return location;
    });

    return this.findOne(organisationId, created.id);
  }

  async findAll(organisationId: string) {
    const locations = await this.prisma.location.findMany({
      where: { organisationId },
      include: locationInclude,
      orderBy: { createdAt: 'desc' },
    });

    return locations.map((location) => this.mapLocation(location));
  }

  async findOne(organisationId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
      include: locationInclude,
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.mapLocation(location);
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

    const { employeeIds, ...data } = dto;

    const validEmployeeIds = employeeIds?.length
      ? await this.validateEmployeeIds(organisationId, employeeIds)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.location.update({
        where: { id: locationId },
        data,
      });

      if (validEmployeeIds) {
        await this.setLocationEmployees(
          tx,
          organisationId,
          locationId,
          validEmployeeIds,
        );
      }
    });

    return this.findOne(organisationId, locationId);
  }

  async remove(organisationId: string, locationId: string) {
    const existing = await this.prisma.location.findFirst({
      where: { id: locationId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    await this.prisma.location.delete({
      where: { id: locationId },
    });

    return { success: true };
  }

  private mapLocation(location: LocationWithEmployees) {
    return {
      ...location,
      employees: location.employees.map(({ employee }) => ({
        ...employee,
        locations: (employee.locations ?? []).map((entry) => entry.location),
      })),
    };
  }

  private async validateEmployeeIds(
    organisationId: string,
    employeeIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(employeeIds));

    const found = await this.prisma.employee.findMany({
      where: {
        organisationId,
        id: { in: uniqueIds },
      },
      select: { id: true },
    });

    if (found.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more employees are invalid for this organisation',
      );
    }

    return uniqueIds;
  }

  private async setLocationEmployees(
    tx: Prisma.TransactionClient,
    organisationId: string,
    locationId: string,
    employeeIds: string[],
  ) {
    await tx.locationAssignment.deleteMany({
      where: {
        organisationId,
        locationId,
        NOT: {
          employeeId: { in: employeeIds },
        },
      },
    });

    if (!employeeIds.length) return;

    const existing = await tx.locationAssignment.findMany({
      where: {
        organisationId,
        locationId,
      },
      select: { employeeId: true },
    });

    const existingIds = new Set(existing.map((item) => item.employeeId));
    const toCreate = employeeIds.filter((id) => !existingIds.has(id));

    if (toCreate.length) {
      await tx.locationAssignment.createMany({
        data: toCreate.map((employeeId) => ({
          organisationId,
          locationId,
          employeeId,
        })),
      });
    }
  }
}
