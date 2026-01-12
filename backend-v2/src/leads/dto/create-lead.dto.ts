import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(160)
  company!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  headcount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  message?: string;

  @IsBoolean()
  consentMarketing!: boolean;

  @IsBoolean()
  consentPrivacy!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmSource?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  website?: string;
}
