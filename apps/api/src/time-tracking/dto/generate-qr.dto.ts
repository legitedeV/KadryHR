import { IsOptional, IsString } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  locationLabel!: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
