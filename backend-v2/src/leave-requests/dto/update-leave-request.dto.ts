import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeaveType } from '@prisma/client';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  attachmentUrl?: string;
}
