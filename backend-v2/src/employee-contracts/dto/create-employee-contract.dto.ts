import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ContractType } from '@prisma/client';

export class CreateEmployeeContractDto {
  @IsEnum(ContractType)
  contractType!: ContractType;

  @IsNumber()
  @IsPositive()
  hourlyRate!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsISO8601()
  validFrom!: string;

  @IsOptional()
  @IsISO8601()
  validTo?: string;
}
