import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return organization;
  }

  async updateMe(organizationId: string, data: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  async getCurrentSummary(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 7);

    const [locationsCount, employeesCount, shiftsLast7DaysCount] = await Promise.all([
      this.prisma.location.count({ where: { organizationId } }),
      this.prisma.employee.count({ where: { organizationId, active: true } }),
      this.prisma.shift.count({
        where: {
          organizationId,
          start: {
            gte: from,
            lte: now,
          },
        },
      }),
    ]);

    return {
      locationsCount,
      employeesCount,
      shiftsLast7DaysCount,
      openTimeAnomaliesCount: 0,
    };
  }
}
