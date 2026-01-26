import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
  Matches,
} from 'class-validator';
import { Weekday } from '@prisma/client';

export class CreateOrganisationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  // Delivery days configuration (Task 4.4)
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  deliveryDays?: Weekday[];

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'deliveryLabelColor must be a valid hex color (e.g., #22c55e)',
  })
  deliveryLabelColor?: string;

  // Promotion change configuration (Task 4.5)
  @IsOptional()
  @IsDateString()
  promotionCycleStartDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  promotionCycleFrequency?: number;
}
