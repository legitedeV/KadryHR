import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationType, Role } from '@prisma/client';

class AudienceFilterDto {
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];
}

export class CreateCampaignDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ValidateNested()
  @Type(() => AudienceFilterDto)
  @IsObject()
  audienceFilter: AudienceFilterDto;
}
