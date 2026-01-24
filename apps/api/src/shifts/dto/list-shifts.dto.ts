import { IsOptional, IsString } from "class-validator";

export class ListShiftsDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
