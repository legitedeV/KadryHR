import { IsOptional, IsString } from "class-validator";

export class ListEntriesDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}
