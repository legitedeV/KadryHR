import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScheduleShiftDto } from './create-schedule-shift.dto';

export class BulkCreateShiftsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateScheduleShiftDto)
  shifts!: CreateScheduleShiftDto[];
}
