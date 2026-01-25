import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { MembershipRole } from "@prisma/client";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.location.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async create(organizationId: string, role: MembershipRole, data: CreateLocationDto) {
    this.ensureManager(role);
    return this.prisma.location.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        city: data.city ?? null,
        code: data.code ?? null,
        timezone: data.timezone ?? null,
        organizationId,
      },
    });
  }

  async update(organizationId: string, role: MembershipRole, id: string, data: UpdateLocationDto) {
    this.ensureManager(role);
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        address: data.address ?? undefined,
        city: data.city ?? undefined,
        code: data.code ?? undefined,
        timezone: data.timezone ?? undefined,
      },
    });
  }

  async remove(organizationId: string, role: MembershipRole, id: string) {
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

  private ensureManager(role: MembershipRole) {
    if (role === MembershipRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
