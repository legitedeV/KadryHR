import { IsString } from 'class-validator';

export class SchedulePeriodActionDto {
  @IsString()
  periodId!: string;
}
