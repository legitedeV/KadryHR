import { Type } from 'class-transformer';
import {
  IsDate,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'color must be a valid hex color (e.g., #ff0000)',
  })
  color?: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;
}
