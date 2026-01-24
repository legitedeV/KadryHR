import { IsOptional, IsString } from "class-validator";

export class TimesheetQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
