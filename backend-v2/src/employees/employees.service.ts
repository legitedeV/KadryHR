import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

type PrismaDbClient = PrismaClient | Prisma.TransactionClient; // <- DODAJ TO

const DEFAULT_TAKE = 20;

type EmployeeWithLocations = Prisma.EmployeeGetPayload<{
  include: { locations: { include: { location: true } } };
}>;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organisationId: string, dto: CreateEmployeeDto) {
    const { locationIds = [] as string[], ...data } = dto;
    const validLocationIds = locationIds.length
      ? await this.validateLocationIds(organisationId, locationIds)
      : [];

    const created = await this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          ...data,
          organisationId,
        },
      });

      if (locationIds.length) {
        await this.setEmployeeLocations(
          tx,
          organisationId,
          employee.id,
          validLocationIds,
        );
      }

      return employee;
    });

    return this.findOne(organisationId, created.id);
  }

  async findAll(
    organisationId: string,
    query: QueryEmployeesDto,
    options?: { restrictToEmployeeId?: string },
  ) {
    const take = query.take ?? DEFAULT_TAKE;
    const skip = query.skip ?? 0;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.EmployeeWhereInput = {
      organisationId,
    };

    if (options?.restrictToEmployeeId) {
      where.id = options.restrictToEmployeeId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        } as Prisma.EmployeeOrderByWithRelationInput,
        include: { locations: { include: { location: true } } },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees.map((employee) => this.mapEmployee(employee)),
      total,
      skip,
      take,
    };
  }

  async findOne(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      include: { locations: { include: { location: true } } },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.mapEmployee(employee);
  }

  async findByUser(organisationId: string, userId: string) {
    return this.prisma.employee.findFirst({
      where: { organisationId, userId },
    });
  }

  async update(
    organisationId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ) {
    const existing = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    const { locationIds, ...data } = dto;
    const validLocationIds = locationIds?.length
      ? await this.validateLocationIds(organisationId, locationIds)
      : undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data,
      });

      if (validLocationIds) {
        await this.setEmployeeLocations(
          tx,
          organisationId,
          employeeId,
          validLocationIds,
        );
      }
    });

    return this.findOne(organisationId, employeeId);
  }

  async remove(organisationId: string, employeeId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.delete({ where: { id: employeeId } });

    return { success: true };
  }

  private mapEmployee(employee: EmployeeWithLocations) {
    return {
      ...employee,
      locations: employee.locations.map(({ location }) => location),
    };
  }

  private async validateLocationIds(
    organisationId: string,
    locationIds: string[],
  ) {
    const uniqueIds = Array.from(new Set(locationIds));
    const found = await this.prisma.location.findMany({
      where: { organisationId, id: { in: uniqueIds } },
      select: { id: true },
    });

    if (found.length !== uniqueIds.length) {
      throw new BadRequestException(
        'One or more locations not found for organisation',
      );
    }

    return uniqueIds;
  }

  private async setEmployeeLocations(
    tx: PrismaClient,
    organisationId: string,
    employeeId: string,
    locationIds: string[],
  ) {
    await tx.locationAssignment.deleteMany({
      where: {
        organisationId,
        employeeId,
        NOT: { locationId: { in: locationIds } },
      },
    });

    if (!locationIds.length) return;

    const existing = await tx.locationAssignment.findMany({
      where: { organisationId, employeeId },
      select: { locationId: true },
    });

    const existingIds = new Set(existing.map((l) => l.locationId));
    const toCreate = locationIds.filter((id) => !existingIds.has(id));

    if (toCreate.length) {
      await tx.locationAssignment.createMany({
        data: toCreate.map((locationId) => ({
          organisationId,
          employeeId,
          locationId,
        })),
      });
    }
  }
}
