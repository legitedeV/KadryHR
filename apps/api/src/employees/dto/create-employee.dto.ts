import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
