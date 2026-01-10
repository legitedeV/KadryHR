import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScheduleTemplateFromWeekDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
