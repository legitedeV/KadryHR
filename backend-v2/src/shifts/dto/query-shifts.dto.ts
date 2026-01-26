import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class QueryShiftsDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
