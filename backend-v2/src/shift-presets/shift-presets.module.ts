import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftPresetsService } from './shift-presets.service';
import { ShiftPresetsController } from './shift-presets.controller';

@Module({
  imports: [PrismaModule],
  providers: [ShiftPresetsService],
  controllers: [ShiftPresetsController],
  exports: [ShiftPresetsService],
})
export class ShiftPresetsModule {}
