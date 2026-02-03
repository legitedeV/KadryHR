import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOrganisationLocationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

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
  @MaxLength(120)
  addressCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressCountry?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultOpeningTimeFrom must be in HH:mm format',
  })
  defaultOpeningTimeFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultOpeningTimeTo must be in HH:mm format',
  })
  defaultOpeningTimeTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  geoLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  geoLng?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(5000)
  geoRadiusMeters?: number;

  @IsOptional()
  @IsBoolean()
  rcpEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  rcpAccuracyMaxMeters?: number;
}

export class UpdateOrganisationLocationDto extends PartialType(
  CreateOrganisationLocationDto,
) {}
