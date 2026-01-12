import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AvailabilityWindowEntryDto {
  @IsDateString()
  date!: string;

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
