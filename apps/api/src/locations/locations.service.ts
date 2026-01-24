import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.location.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async create(organizationId: string, role: UserRole, data: CreateLocationDto) {
    this.ensureManager(role);
    return this.prisma.location.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        organizationId,
      },
    });
  }

  async update(organizationId: string, role: UserRole, id: string, data: UpdateLocationDto) {
    this.ensureManager(role);
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    return this.prisma.location.update({
      where: { id },
      data,
    });
  }

  async remove(organizationId: string, role: UserRole, id: string) {
    this.ensureManager(role);
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    await this.prisma.location.delete({ where: { id } });
    return { success: true };
  }

  private ensureManager(role: UserRole) {
    if (role === UserRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
