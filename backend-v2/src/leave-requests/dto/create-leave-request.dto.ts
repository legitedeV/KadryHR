import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LeaveCategory } from '@prisma/client';

export class CreateLeaveRequestDto {
  /**
   * Preferred fields (consistent with shifts):
   */
  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  /**
   * Backward-compatible aliases (your current DTO used these):
   */
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsEnum(LeaveCategory)
  type!: LeaveCategory;

  @IsOptional()
  @IsUUID('4')
  leaveTypeId?: string;

  @IsOptional()
  @IsString()
  leaveType?: string;

  /**
   * Reason/notes
   */
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  /**
   * Optional: manager/owner can create for a specific employee
   */
  @IsOptional()
  @IsString()
  employeeId?: string;
}
