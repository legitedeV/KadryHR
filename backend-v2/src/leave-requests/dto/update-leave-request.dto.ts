import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { LeaveCategory } from '@prisma/client';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveCategory)
  type?: LeaveCategory;

  @IsOptional()
  @IsUUID('4')
  leaveTypeId?: string;
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
  leaveType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  attachmentUrl?: string;
}
