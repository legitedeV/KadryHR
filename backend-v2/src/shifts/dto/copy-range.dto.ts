import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CopyRangeDto {
  @IsISO8601()
  sourceFrom!: string;

  @IsISO8601()
  sourceTo!: string;

  @IsISO8601()
  targetFrom!: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
