import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  employeeId!: string;

  @IsDateString()
  date!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;

  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
