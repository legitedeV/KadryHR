import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateShiftPresetDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(32)
  code!: string;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  endMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
