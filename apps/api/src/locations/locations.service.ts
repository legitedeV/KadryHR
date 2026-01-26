import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { MembershipRole } from "@prisma/client";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.location.findMany({
      where: { organizationId, archivedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async getById(organizationId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId, archivedAt: null },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }
    return location;
  }

  async create(organizationId: string, role: MembershipRole, data: CreateLocationDto) {
    this.ensureManager(role);
    const name = data.name.trim();
    const code = data.code?.trim() || null;
    const address = data.address?.trim() || null;
    const city = data.city?.trim() || null;
    const timezone = data.timezone?.trim() || null;

    if (code) {
      const existing = await this.prisma.location.findFirst({
        where: { organizationId, code },
      });
      if (existing) {
        throw new BadRequestException("Kod lokalizacji musi być unikalny w ramach organizacji.");
      }
    }

    return this.prisma.location.create({
      data: {
        name,
        address,
        city,
        code,
        timezone,
        organizationId,
      },
    });
  }

  async update(organizationId: string, role: MembershipRole, id: string, data: UpdateLocationDto) {
    this.ensureManager(role);
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId, archivedAt: null },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const code = data.code?.trim();
    if (code && code !== location.code) {
      const existing = await this.prisma.location.findFirst({
        where: { organizationId, code },
      });
      if (existing) {
        throw new BadRequestException("Kod lokalizacji musi być unikalny w ramach organizacji.");
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? undefined,
        address: data.address !== undefined ? data.address.trim() || null : undefined,
        city: data.city !== undefined ? data.city.trim() || null : undefined,
        code: data.code !== undefined ? data.code.trim() || null : undefined,
        timezone: data.timezone !== undefined ? data.timezone.trim() || null : undefined,
      },
    });
  }

  async remove(organizationId: string, role: MembershipRole, id: string) {
    this.ensureManager(role);
    const location = await this.prisma.location.findFirst({
      where: { id, organizationId, archivedAt: null },
    });
    if (!location) {
      throw new NotFoundException("Location not found");
    }

    await this.prisma.location.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return { success: true };
  }

  private ensureManager(role: MembershipRole) {
    if (role === MembershipRole.EMPLOYEE) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
}
