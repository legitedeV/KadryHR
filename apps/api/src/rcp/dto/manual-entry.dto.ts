import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ManualEntryDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsDateString()
  clockIn!: string;

  @IsOptional()
  @IsDateString()
  clockOut?: string;
}
