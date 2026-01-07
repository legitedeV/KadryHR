import { IsBoolean, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityWindowDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsISO8601()
  deadline!: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}
