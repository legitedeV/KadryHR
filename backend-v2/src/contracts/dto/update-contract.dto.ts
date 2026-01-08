import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '@prisma/client';
import { CreateContractDto } from './create-contract.dto';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;
}
