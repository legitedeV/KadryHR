import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class NewsletterSubscribeDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsBoolean()
  marketingConsent!: boolean;
}
