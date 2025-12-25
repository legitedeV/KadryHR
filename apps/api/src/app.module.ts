import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { VersionModule } from './version/version.module';
import { ScheduleModule } from './schedule/schedule.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    AuthModule,
    HealthModule,
    VersionModule,
    ScheduleModule,
  ],
})
export class AppModule {}
