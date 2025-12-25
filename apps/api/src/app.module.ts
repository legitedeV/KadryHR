import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { VersionModule } from './version/version.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, VersionModule],
})
export class AppModule {}
