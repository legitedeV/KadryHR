import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { RcpEventType } from '@prisma/client';

export class ListRcpEventsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  skip = 0;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(200)
  take = 50;

  @IsOptional()
  @IsEnum(RcpEventType)
  type?: RcpEventType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
