import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrganisationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string;
}
