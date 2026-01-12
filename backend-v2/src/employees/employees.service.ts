import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

  async ensureEmployeeProfile(organisationId: string, userId: string) {
    const existing = await this.findByUser(organisationId, userId);

    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException(
        'Uzupełnij imię i nazwisko w profilu użytkownika, aby utworzyć profil pracownika',
      );
    }

    const created = await this.prisma.employee.create({
      data: {
        organisationId,
        userId: user.id,
        firstName,
        lastName,
        email: user.email,
      },
    });

    await this.auditService.record({
      organisationId,
      actorUserId: userId,
      action: 'employee.profile.created',
      entityType: 'employee',
      entityId: created.id,
      after: {
        userId: user.id,
        createdFromUserProfile: true,
      },
    });

    return created;
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

    if (query.status && query.status !== 'all') {
      if (query.status === 'active') {
        where.isActive = true;
        where.isDeleted = false;
      }

      if (query.status === 'inactive') {
        const existingAnd = Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : [];

        where.AND = [
          ...existingAnd,
          {
            OR: [{ isActive: false }, { isDeleted: true }],
          },
        ];
      }
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
      select: {
        id: true,
        isDeleted: true,
        isActive: true,
        employmentEndDate: true,
        userId: true,
        _count: {
          select: {
            shifts: true,
            scheduleTemplateShifts: true,
            documents: true,
            contracts: true,
            leaveRequests: true,
            leaveBalances: true,
            availability: true,
            availabilitySubmissions: true,
            locations: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    const hasHistory =
      existing._count.shifts > 0 ||
      existing._count.scheduleTemplateShifts > 0 ||
      existing._count.documents > 0 ||
      existing._count.contracts > 0 ||
      existing._count.leaveRequests > 0 ||
      existing._count.leaveBalances > 0 ||
      existing._count.availability > 0 ||
      existing._count.availabilitySubmissions > 0;

    if (hasHistory) {
      const data: Prisma.EmployeeUpdateInput = {
        isDeleted: true,
        isActive: false,
      };

      if (!existing.employmentEndDate) {
        data.employmentEndDate = new Date();
      }

      const updated = await this.prisma.employee.update({
        where: { id: employeeId },
        data,
      });

      if (existing.userId) {
        await this.notificationsService.createNotification({
          organisationId,
          userId: existing.userId,
          type: NotificationType.CUSTOM,
          title: 'Twoje konto pracownika zostało dezaktywowane',
          body: 'Twoje konto zostało oznaczone jako usunięte. Zachowaliśmy historię grafików i dokumentów.',
        });
      }

      return { success: true, softDeleted: true, employee: updated };
    }

    await this.prisma.employee.delete({ where: { id: employeeId } });

    if (existing.userId) {
      await this.notificationsService.createNotification({
        organisationId,
        userId: existing.userId,
        type: NotificationType.CUSTOM,
        title: 'Twoje konto pracownika zostało usunięte',
        body: 'Twoje konto zostało trwale usunięte z organizacji.',
      });
    }

    return { success: true, softDeleted: false };
  }

  async deactivate(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      select: {
        id: true,
        isActive: true,
        isDeleted: true,
        employmentEndDate: true,
        userId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.isDeleted) {
      throw new BadRequestException('Pracownik jest już usunięty.');
    }

    const data: Prisma.EmployeeUpdateInput = {
      isActive: false,
    };

    if (!employee.employmentEndDate) {
      data.employmentEndDate = new Date();
    }

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data,
    });

    if (employee.userId) {
      await this.notificationsService.createNotification({
        organisationId,
        userId: employee.userId,
        type: NotificationType.CUSTOM,
        title: 'Twoje konto pracownika zostało dezaktywowane',
        body: 'Nie możesz logować się do systemu ani być przypisywany(a) do grafiku.',
      });
    }

    return updated;
  }

  async activate(organisationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organisationId },
      select: {
        id: true,
        isActive: true,
        isDeleted: true,
        userId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const updated = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        isActive: true,
        isDeleted: false,
        employmentEndDate: null,
      },
    });

    if (employee.userId) {
      await this.notificationsService.createNotification({
        organisationId,
        userId: employee.userId,
        type: NotificationType.CUSTOM,
        title: 'Twoje konto pracownika zostało ponownie aktywowane',
        body: 'Możesz ponownie logować się do systemu i być przypisywany(a) do grafiku.',
      });
    }

    return updated;
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
