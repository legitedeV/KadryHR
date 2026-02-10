import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRcpCorrectionDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  managerNote?: string;
}

