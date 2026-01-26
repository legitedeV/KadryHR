import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CopyWeekDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
