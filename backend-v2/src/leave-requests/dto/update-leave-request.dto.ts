import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
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
