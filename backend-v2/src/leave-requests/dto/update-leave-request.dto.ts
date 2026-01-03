import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  // aliases
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  leaveTypeId?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  leaveType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;
}
