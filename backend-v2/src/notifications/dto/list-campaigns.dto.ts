import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationCampaignStatus } from '@prisma/client';

export class ListCampaignsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @IsOptional()
  @IsEnum(NotificationCampaignStatus)
  status?: NotificationCampaignStatus;
}
