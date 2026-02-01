import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmployeeDocumentStatus, EmployeeDocumentType } from '@prisma/client';

export class UpdateDocumentDto {
  @IsOptional()
  @IsEnum(EmployeeDocumentType)
  type?: EmployeeDocumentType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  issuedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @IsEnum(EmployeeDocumentStatus)
  status?: EmployeeDocumentStatus;
}
