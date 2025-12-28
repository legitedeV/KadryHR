import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Weekday } from '@prisma/client';

export class CreateAvailabilityDto {
  @IsString()
  employeeId!: string;

  @ValidateIf((o) => !o.weekday)
  @IsString()
  date?: string;

  @ValidateIf((o) => !o.date)
  @IsEnum(Weekday)
  weekday?: Weekday;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  startMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(24 * 60)
  endMinutes!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
