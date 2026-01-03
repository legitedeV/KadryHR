import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mapuje użytkownika (User) na powiązanego Employee w danej organizacji.
   */
  findByUser(organisationId: string, userId: string) {
    return this.prisma.employee.findFirst({
      where: {
        organisationId,
        userId,
      },
    });
  }

  /**
   * Lista pracowników – z paginacją, wyszukiwaniem, sortowaniem.
   * Dla EMPLOYEE można ograniczyć widok do jednego employee (options.restrictToEmployeeId).
   */
  async findAll(
    organisationId: string,
    query: QueryEmployeesDto,
    options?: { restrictToEmployeeId?: string },
  ) {
    const take = Math.min(query.take ?? query.pageSize ?? 20, 100);
    const page =
      query.page ??
      (query.skip !== undefined
        ? Math.floor(query.skip / Math.max(take, 1)) + 1
        : 1);
    const skip = query.skip ?? (page - 1) * take;
    const term = (query.search ?? query.q ?? '').trim();

    const where: Prisma.EmployeeWhereInput = {
      organisationId,
    };

    if (options?.restrictToEmployeeId) {
      where.id = options.restrictToEmployeeId;
    }

    if (term) {
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.locationId) {
      const existingAnd = Array.isArray(where.AND)
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];

      where.AND = [
        ...existingAnd,
        {
          OR: [
            { locations: { some: { locationId: query.locationId } } },
            { shifts: { some: { locationId: query.locationId } } },
          ],
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: buildEmployeeOrder(query),
        skip,
        take,
        include: {
          locations: { include: { location: true } },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    const mapped = items.map((item) => ({
      ...item,
      locations: (item.locations ?? []).map((entry) => entry.location),
    }));

    return {
      data: mapped,
      total,
      skip,
      take,
    };
  }

  /**
   * Utworzenie pracownika w organizacji.
   */
  create(organisationId: string, dto: any) {
    return this.prisma.employee.create({
      data: {
        organisationId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        position: dto.position ?? null,
      },
    });
  }

  /**
   * Pojedynczy pracownik (z kontrolą org).
   */
  async findOne(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      include: {
        organisation: {
          select: { id: true, name: true },
        },
        shifts: {
          orderBy: { startsAt: 'desc' },
          include: { location: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  /**
   * Aktualizacja pracownika z kontrolą organisationId.
   */
  async update(organisationId: string, employeeId: string, dto: any) {
    const existing = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        firstName: dto.firstName ?? existing.firstName,
        lastName: dto.lastName ?? existing.lastName,
        email: dto.email ?? existing.email,
        phone: dto.phone ?? existing.phone,
        position: dto.position ?? existing.position,
      },
    });
  }

  /**
   * Usunięcie pracownika z kontrolą organisationId.
   */
  async remove(organisationId: string, employeeId: string) {
    const existing = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.delete({
      where: { id: employeeId },
    });

    return { success: true };
  }
}

function buildEmployeeOrder(
  sort: QueryEmployeesDto,
): Prisma.EmployeeOrderByWithRelationInput {
  if (sort.sortBy) {
    return {
      [sort.sortBy]: sort.sortOrder ?? 'asc',
    } as Prisma.EmployeeOrderByWithRelationInput;
  }

  const legacy = sort.sort ?? 'createdAt-desc';
  const [fieldRaw, directionRaw] = legacy.split('-');
  const direction: Prisma.SortOrder = directionRaw === 'asc' ? 'asc' : 'desc';

  const allowed: (keyof Prisma.EmployeeOrderByWithRelationInput)[] = [
    'firstName',
    'lastName',
    'email',
    'createdAt',
    'updatedAt',
    'position',
  ];

  if (!fieldRaw || !allowed.includes(fieldRaw as any)) {
    return { createdAt: 'desc' };
  }

  return {
    [fieldRaw]: direction,
  } as Prisma.EmployeeOrderByWithRelationInput;
}
