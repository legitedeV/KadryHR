import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejectionReason?: string;
}
