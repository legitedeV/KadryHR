import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateShiftSwapRequestDto {
  @IsUUID('4')
  shiftId!: string;

  @IsUUID('4')
  targetEmployeeId!: string;

  @IsISO8601()
  targetDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  note?: string;
}
