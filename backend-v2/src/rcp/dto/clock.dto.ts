import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { RcpEventType } from '@prisma/client';

export class ClockDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(RcpEventType)
  type: RcpEventType;

  @IsNumber()
  @Min(-90)
  @Max(90)
  clientLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  clientLng: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  accuracyMeters?: number;

  @IsDateString()
  @IsOptional()
  clientTime?: string;
}
