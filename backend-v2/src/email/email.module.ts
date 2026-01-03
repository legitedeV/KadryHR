import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailAdapter } from './email.adapter';

@Module({
  imports: [ConfigModule],
  providers: [EmailAdapter],
  exports: [EmailAdapter],
})
export class EmailModule {}
