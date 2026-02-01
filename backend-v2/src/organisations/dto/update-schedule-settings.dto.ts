import { IsArray, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { SchedulePeriodType, Weekday } from '@prisma/client';

export class UpdateScheduleSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultWorkdayStart must be in HH:mm format',
  })
  defaultWorkdayStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'defaultWorkdayEnd must be in HH:mm format',
  })
  defaultWorkdayEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(480)
  defaultBreakMinutes?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  workDays?: Weekday[];

  @IsOptional()
  @IsEnum(SchedulePeriodType)
  schedulePeriod?: SchedulePeriodType;
}
