import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityStatus } from '@prisma/client';

export class AvailabilityWindowEntryDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  status?: AvailabilityStatus;

  @ValidateIf((o) => o.status !== AvailabilityStatus.DAY_OFF)
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  startMinutes!: number;

  @ValidateIf((o) => o.status !== AvailabilityStatus.DAY_OFF)
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  endMinutes!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitAvailabilityWindowDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowEntryDto)
  availabilities!: AvailabilityWindowEntryDto[];

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
