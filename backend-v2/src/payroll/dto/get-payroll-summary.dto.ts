import { IsString, IsISO8601 } from 'class-validator';

export class GetPayrollSummaryDto {
  @IsString()
  employeeId!: string;

  @IsISO8601()
  month!: string; // Format: YYYY-MM
}
