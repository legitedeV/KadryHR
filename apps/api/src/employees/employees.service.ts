import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { MembershipRole } from "@prisma/client";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async create(organizationId: string, role: MembershipRole, data: CreateEmployeeDto) {
    this.ensureManager(role);

    if (data.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: data.locationId, organizationId },
      });
      if (!location) {
        throw new NotFoundException("Location not found in organization");
      }
    }

    return this.prisma.employee.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        externalCode: data.externalCode ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        employmentType: data.employmentType,
        organizationId,
        locationId: data.locationId ?? null,
      },
    });
  }

  async update(organizationId: string, role: MembershipRole, id: string, data: UpdateEmployeeDto) {
    this.ensureManager(role);

    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    if (data.locationId) {
      const location = await this.prisma.location.findFirst({
        where: { id: data.locationId, organizationId },
      });
      if (!location) {
        throw new NotFoundException("Location not found in organization");
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        externalCode: data.externalCode ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        locationId: data.locationId === null ? null : data.locationId ?? undefined,
        employmentType: data.employmentType ?? undefined,
        active: data.active ?? undefined,
      },
    });
  }

  async remove(organizationId: string, role: MembershipRole, id: string) {
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

  private ensureManager(role: MembershipRole) {
    if (role === MembershipRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
