import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ContractType, WorkTimeType, CompensationType } from '@prisma/client';

export class CreateContractDto {
  @IsNotEmpty()
  @IsString()
  employeeId!: string;

  @IsEnum(ContractType)
  type!: ContractType;

  @IsEnum(WorkTimeType)
  @IsOptional()
  workTimeType?: WorkTimeType;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Compensation data (optional, can be added separately)
  @IsEnum(CompensationType)
  @IsOptional()
  compensationType?: CompensationType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  compensationAmount?: number;
}
