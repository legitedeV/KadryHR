import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsAdapter } from './sms.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SmsAdapter],
  exports: [SmsAdapter],
})
export class SmsModule {}
