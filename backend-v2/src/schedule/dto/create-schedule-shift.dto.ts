import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScheduleShiftDto {
  @IsOptional()
  @IsString()
  periodId?: string;

  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  note?: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}
