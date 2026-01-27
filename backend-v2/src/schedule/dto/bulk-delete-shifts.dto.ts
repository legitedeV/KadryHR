import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkDeleteShiftsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  shiftIds!: string[];
}
