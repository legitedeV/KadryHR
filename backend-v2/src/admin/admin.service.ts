import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListQueryDto, ListUsersQueryDto } from './dto/list-query.dto';
import { Role } from '@prisma/client';
import { UpdatePlatformConfigDto } from './dto/platform-config.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemStats() {
    const [totalOrganisations, totalEmployees, totalUsers, totalShifts] =
      await Promise.all([
        this.prisma.organisation.count(),
        this.prisma.employee.count({ where: { isDeleted: false } }),
        this.prisma.user.count(),
        this.prisma.shift.count(),
      ]);

    return {
      totalOrganisations,
      totalEmployees,
      totalUsers,
      totalShifts,
    };
  }

  async listOrganisations(query: ListQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const [data, total] = await Promise.all([
      this.prisma.organisation.findMany({
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
          _count: {
            select: {
              employees: { where: { isDeleted: false } },
              users: true,
            },
          },
        },
      }),
      this.prisma.organisation.count(),
    ]);

    return {
      data: data.map((org) => ({
        id: org.id,
        name: org.name,
        category: org.category,
        employeeCount: org._count.employees,
        userCount: org._count.users,
        createdAt: org.createdAt.toISOString(),
      })),
      total,
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: { role?: Role } = {};
    if (query.role && Object.values(Role).includes(query.role as Role)) {
      where.role = query.role as Role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organisationId: true,
          createdAt: true,
          organisation: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organisationId: user.organisationId,
        organisationName: user.organisation.name,
        createdAt: user.createdAt.toISOString(),
      })),
      total,
    };
  }

  private async ensurePlatformConfig() {
    return this.prisma.platformConfig.upsert({
      where: { id: 'platform' },
      create: {
        id: 'platform',
        frontendConfig: {},
        backendConfig: {},
      },
      update: {},
    });
  }

  async getPlatformConfig() {
    const config = await this.ensurePlatformConfig();
    return {
      id: config.id,
      frontendConfig: config.frontendConfig ?? {},
      backendConfig: config.backendConfig ?? {},
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async updatePlatformConfig(payload: UpdatePlatformConfigDto) {
    const existing = await this.ensurePlatformConfig();
    const frontendConfig = payload.frontendConfig ?? existing.frontendConfig ?? {};
    const backendConfig = payload.backendConfig ?? existing.backendConfig ?? {};

    const updated = await this.prisma.platformConfig.update({
      where: { id: existing.id },
      data: {
        frontendConfig,
        backendConfig,
      },
    });

    return {
      id: updated.id,
      frontendConfig: updated.frontendConfig ?? {},
      backendConfig: updated.backendConfig ?? {},
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getSystemStatus() {
    const status = {
      api: 'ok',
      database: 'unknown',
      checkedAt: new Date().toISOString(),
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      status.database = 'ok';
    } catch {
      status.database = 'error';
    }

    return status;
  }
}
