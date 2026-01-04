import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAdapter } from './email.adapter';
import { EmailController } from './email.controller';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailAdapter],
  controllers: [EmailController],
  exports: [EmailAdapter],
})
export class EmailModule {}
