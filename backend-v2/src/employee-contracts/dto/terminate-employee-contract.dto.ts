import { IsISO8601, IsOptional } from 'class-validator';

export class TerminateEmployeeContractDto {
  @IsOptional()
  @IsISO8601()
  terminatedAt?: string;
}
