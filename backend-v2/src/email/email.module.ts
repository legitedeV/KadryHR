import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAdapter } from './email.adapter';
import { EmailController } from './email.controller';
import { EmailTemplatesService } from './email-templates.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailAdapter, EmailTemplatesService],
  controllers: [EmailController],
  exports: [EmailAdapter, EmailTemplatesService],
})
export class EmailModule {}
