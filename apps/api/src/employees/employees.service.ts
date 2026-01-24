import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async create(organizationId: string, role: UserRole, data: CreateEmployeeDto) {
    this.ensureManager(role);

    if (data.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.userId, organizationId },
      });
      if (!user) {
        throw new NotFoundException("User not found in organization");
      }
    }

    return this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        employeeCode: data.employeeCode ?? null,
        email: data.email ?? null,
        organizationId,
        userId: data.userId ?? null,
      },
    });
  }

  async update(organizationId: string, role: UserRole, id: string, data: UpdateEmployeeDto) {
    this.ensureManager(role);

    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    if (data.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: data.userId, organizationId },
      });
      if (!user) {
        throw new NotFoundException("User not found in organization");
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        employeeCode: data.employeeCode ?? undefined,
        email: data.email ?? undefined,
        userId: data.userId === null ? null : data.userId ?? undefined,
      },
    });
  }

  async remove(organizationId: string, role: UserRole, id: string) {
    this.ensureManager(role);

    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }

  private ensureManager(role: UserRole) {
    if (role === UserRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
