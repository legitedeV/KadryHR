import { IsString } from 'class-validator';

export class DuplicatePreviousPeriodDto {
  @IsString()
  periodId!: string;
}
