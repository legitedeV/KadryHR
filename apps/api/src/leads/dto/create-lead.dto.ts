import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsOptional()
  employeesCount?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  source?: string;
}
