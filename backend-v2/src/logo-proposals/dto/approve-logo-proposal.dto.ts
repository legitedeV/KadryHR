import { IsBoolean, IsOptional } from 'class-validator';

export class ApproveLogoProposalDto {
  @IsOptional()
  @IsBoolean()
  applyToOrganisation?: boolean;
}
