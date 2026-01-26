import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { WebsiteService } from './website.service';
import {
  WebsiteAdminController,
  WebsitePublicController,
} from './website.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [WebsiteAdminController, WebsitePublicController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
