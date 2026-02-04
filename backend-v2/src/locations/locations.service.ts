import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

  async geocodeLocation(lat: number, lng: number) {
    this.assertValidCoordinates(lat, lng);

    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('GOOGLE_MAPS_API_KEY is not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'pl');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new BadRequestException('Google Maps geocoding failed');
    }

    const payload = (await response.json()) as {
      status: string;
      error_message?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }>;
    };

    if (payload.status !== 'OK' || !payload.results?.length) {
      throw new BadRequestException(
        payload.error_message ?? 'Nie udało się znaleźć adresu',
      );
    }

    const [result] = payload.results;
    const component = (types: string[]) =>
      result.address_components?.find((item) =>
        types.every((type) => item.types.includes(type)),
      );

    const street = component(['route'])?.long_name ?? null;
    const streetNumber = component(['street_number'])?.long_name ?? null;
    const postalCode = component(['postal_code'])?.long_name ?? null;
    const city =
      component(['locality'])?.long_name ??
      component(['postal_town'])?.long_name ??
      component(['administrative_area_level_2'])?.long_name ??
      null;
    const country = component(['country'])?.long_name ?? null;

    return {
      formattedAddress: result.formatted_address ?? null,
      street,
      streetNumber,
      postalCode,
      city,
      country,
    };
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

  private assertValidCoordinates(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('Nieprawidłowe współrzędne');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new BadRequestException('Nieprawidłowe współrzędne');
    }
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
