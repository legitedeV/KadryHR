import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get subscription for an organisation
   */
  async getByOrganisationId(organisationId: string) {
    return this.prisma.subscription.findUnique({
      where: { organisationId },
    });
  }

  /**
   * Create or update subscription for an organisation
   */
  async upsert(organisationId: string, data: { plan?: string; status?: string; trialEndsAt?: Date }) {
    return this.prisma.subscription.upsert({
      where: { organisationId },
      create: {
        organisationId,
        ...data,
      },
      update: data,
    });
  }
}
