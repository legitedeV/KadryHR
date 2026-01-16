import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { LogoProposalStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryLogoProposalsDto {
  @IsOptional()
  @IsEnum(LogoProposalStatus)
  status?: LogoProposalStatus;

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
}
