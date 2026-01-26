import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { EmailModule } from '../email/email.module';
import { NewsletterService } from './newsletter.service';
import {
  NewsletterController,
  PublicNewsletterController,
} from './newsletter.controller';

@Module({
  imports: [PrismaModule, QueueModule, EmailModule],
  controllers: [PublicNewsletterController, NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
