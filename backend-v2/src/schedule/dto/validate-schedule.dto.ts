import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidateScheduleDto {
  @IsString()
  periodId!: string;

  @IsOptional()
  @IsBoolean()
  persist?: boolean;
}
