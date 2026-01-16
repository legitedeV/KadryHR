import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LogoProposalVote } from '@prisma/client';

export class FeedbackLogoProposalDto {
  @IsEnum(LogoProposalVote)
  vote!: LogoProposalVote;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
