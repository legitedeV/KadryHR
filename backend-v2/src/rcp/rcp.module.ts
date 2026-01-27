import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RcpController } from './rcp.controller';
import { RcpService } from './rcp.service';
import { RcpTokenService } from './services/rcp-token.service';
import { RcpRateLimitService } from './services/rcp-rate-limit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [RcpController],
  providers: [RcpService, RcpTokenService, RcpRateLimitService],
  exports: [RcpService],
})
export class RcpModule {}
