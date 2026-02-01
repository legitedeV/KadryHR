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
  MinLength,
  IsEmail,
  Max,
} from 'class-validator';
import { SchedulePeriodType, Weekday } from '@prisma/client';

export class CreateOrganisationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  displayName?: string;

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
  @MaxLength(255)
  addressStreet?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[0-9A-Za-z\s-]{3,12}$/, {
    message: 'addressPostalCode must be a valid postal code',
  })
  addressPostalCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  addressCity?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  addressCountry?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[+0-9\s()-]{6,20}$/, {
    message: 'contactPhone must be a valid phone number',
  })
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'websiteUrl must be a valid URL' })
  websiteUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z]{0,2}[0-9]{8,14}$/, {
    message: 'taxId must be a valid VAT/NIP identifier',
  })
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  invoiceAddress?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultWorkdayStart must be in HH:mm format',
  })
  defaultWorkdayStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultWorkdayEnd must be in HH:mm format',
  })
  defaultWorkdayEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(480)
  defaultBreakMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  workDays?: Weekday[];

  @IsOptional()
  @IsEnum(SchedulePeriodType)
  schedulePeriod?: SchedulePeriodType;

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
