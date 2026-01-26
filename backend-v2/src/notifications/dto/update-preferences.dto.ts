import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { NotificationType } from '@prisma/client';

class PreferenceDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsBoolean()
  inApp!: boolean;

  @IsBoolean()
  email!: boolean;

  @IsBoolean()
  @IsOptional()
  sms?: boolean;

  @IsBoolean()
  @IsOptional()
  push?: boolean; // Future: push notifications
}

export class UpdatePreferencesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PreferenceDto)
  preferences!: PreferenceDto[];
}
