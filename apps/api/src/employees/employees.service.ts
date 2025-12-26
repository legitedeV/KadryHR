import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SearchEmployeesDto } from './dto/search-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string, query: SearchEmployeesDto) {
    const { search, status } = query;

    const where: any = { orgId };

    if (status === 'active') {
      where.active = true;
    } else if (status === 'inactive') {
      where.active = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, orgId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(orgId: string, dto: CreateEmployeeDto, createdById?: string) {
    return this.prisma.employee.create({
      data: {
        orgId,
        name: dto.name,
        email: dto.email,
        active: true,
        createdById,
      },
    });
  }

  async update(orgId: string, id: string, dto: UpdateEmployeeDto) {
    await this.ensureEmployeeInOrg(id, orgId);

    return this.prisma.employee.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        active: dto.active,
      },
    });
  }

  async deactivate(orgId: string, id: string) {
    await this.ensureEmployeeInOrg(id, orgId);

    return this.prisma.employee.update({
      where: { id },
      data: { active: false },
    });
  }

  async getStatus(orgId: string) {
    const [total, active] = await Promise.all([
      this.prisma.employee.count({ where: { orgId } }),
      this.prisma.employee.count({ where: { orgId, active: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
    };
  }

  private async ensureEmployeeInOrg(id: string, orgId: string) {
    const exists = await this.prisma.employee.findFirst({ where: { id, orgId } });

    if (!exists) {
      throw new BadRequestException('Employee does not belong to this organization');
    }
  }
}
