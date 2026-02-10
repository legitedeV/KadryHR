import { IsArray, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, ArrayUnique } from 'class-validator';
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
  @IsInt()
  @Min(1)
  @Max(24)
  dailyWorkNormHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  weeklyWorkNormHours?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true, message: 'holidays must be an array of YYYY-MM-DD dates' })
  holidays?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  workDays?: Weekday[];

  @IsOptional()
  @IsEnum(SchedulePeriodType)
  schedulePeriod?: SchedulePeriodType;
}
