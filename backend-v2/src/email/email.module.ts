import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAdapter } from './email.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailAdapter],
  exports: [EmailAdapter],
})
export class EmailModule {}
