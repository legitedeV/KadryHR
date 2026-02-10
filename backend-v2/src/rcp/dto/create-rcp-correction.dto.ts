import { IsDateString, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RcpEventType } from '@prisma/client';

export class CreateRcpCorrectionDto {
  @IsString()
  eventId: string;

  @IsEnum(RcpEventType)
  requestedType: RcpEventType;

  @IsDateString()
  requestedHappenedAt: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}

