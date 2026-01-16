import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectLogoProposalDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
