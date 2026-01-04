import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeaveCategory } from '@prisma/client';

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEnum(LeaveCategory)
  code?: LeaveCategory;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}
