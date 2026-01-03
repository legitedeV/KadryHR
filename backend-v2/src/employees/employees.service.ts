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
    const {
      page = 1,
      pageSize = 20,
      q,
      sort = 'createdAt-desc',
      locationId,
      // status zostawiamy na później; nie opieramy się na polu isActive w schemacie
      // bo nie mamy tu 100% pewności co do migracji
      // status,
    } = query;

    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: Prisma.EmployeeWhereInput = {
      organisationId,
    };

    if (options?.restrictToEmployeeId) {
      where.id = options.restrictToEmployeeId;
    }

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (locationId) {
      // Filtr: pracownik ma przynajmniej jedną zmianę w tej lokalizacji.
      where.shifts = {
        some: { locationId },
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: buildEmployeeOrder(sort),
        skip,
        take,
        include: {
          organisation: {
            select: { id: true, name: true },
          },
          shifts: {
            take: 1,
            orderBy: { startsAt: 'desc' },
            include: { location: true },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: take,
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
  sort: string,
): Prisma.EmployeeOrderByWithRelationInput {
  const [fieldRaw, directionRaw] = sort.split('-');
  const direction: Prisma.SortOrder =
    directionRaw === 'asc' ? 'asc' : 'desc';

  const allowed: (keyof Prisma.EmployeeOrderByWithRelationInput)[] = [
    'firstName',
    'lastName',
    'email',
    'createdAt',
    'updatedAt',
  ];

  if (!fieldRaw || !allowed.includes(fieldRaw as any)) {
    return { createdAt: 'desc' };
  }

  return {
    [fieldRaw]: direction,
  } as Prisma.EmployeeOrderByWithRelationInput;
}
