import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  address?: string;
}
