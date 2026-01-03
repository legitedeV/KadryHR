import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LeaveCategory } from '@prisma/client';

export class CreateLeaveRequestDto {
  @IsOptional()
  @IsUUID('4')
  employeeId?: string;

  @IsEnum(LeaveCategory)
  type!: LeaveCategory;

  @IsOptional()
  @IsUUID('4')
  leaveTypeId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  attachmentUrl?: string;
}
