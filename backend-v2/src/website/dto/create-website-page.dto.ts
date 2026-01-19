import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWebsitePageDto {
  @IsString()
  @MaxLength(64)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
