import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { NewsletterSubscriptionStatus } from '@prisma/client';

export class QueryNewsletterSubscribersDto {
  @IsOptional()
  @IsEnum(NewsletterSubscriptionStatus)
  status?: NewsletterSubscriptionStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to?: Date;

  @IsOptional()
  @IsString()
  email?: string;
}
