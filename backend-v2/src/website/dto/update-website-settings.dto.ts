import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateWebsiteSettingsDto {
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayNotEmpty()
  contactEmails?: string[];

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  footerLinks?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cookieBannerText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cookiePolicyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  privacyPolicyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  termsOfServiceUrl?: string;
}
