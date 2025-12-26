import { TimeEntryEvent, TimeEntrySource } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class RecordEventDto {
  @IsString()
  employeeId!: string;

  @IsEnum(TimeEntryEvent)
  event!: TimeEntryEvent;

  @IsOptional()
  @IsEnum(TimeEntrySource)
  source?: TimeEntrySource;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
