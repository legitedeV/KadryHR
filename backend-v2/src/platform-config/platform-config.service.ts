import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getFrontendConfig() {
    const config = await this.ensurePlatformConfig();
    return {
      frontendConfig: config.frontendConfig ?? {},
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
