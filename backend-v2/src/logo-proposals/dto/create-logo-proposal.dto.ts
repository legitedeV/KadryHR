import { IsHexColor, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLogoProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsHexColor()
  primaryColor!: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  typography?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  symbol?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  logoSvg!: string;

  @IsOptional()
  @IsObject()
  logoConfig?: Record<string, unknown>;
}
