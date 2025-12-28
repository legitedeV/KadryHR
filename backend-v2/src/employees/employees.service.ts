import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        ...dto,
        organisationId,
      },
    });
  }

  findAll(organisationId: string, pagination: PaginationDto) {
    return this.prisma.employee.findMany({
      where: { organisationId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
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

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: dto,
    });
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
}
