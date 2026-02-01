import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { EmployeeDocumentStatus, EmployeeDocumentType } from '@prisma/client';

export class CreateDocumentRequestDto {
  @IsEnum(EmployeeDocumentType)
  type!: EmployeeDocumentType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsISO8601()
  issuedAt!: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsEnum(EmployeeDocumentStatus)
  status?: EmployeeDocumentStatus;
}
