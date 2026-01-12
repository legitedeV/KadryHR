import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController, PublicLeadsController } from './leads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [PublicLeadsController, LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
