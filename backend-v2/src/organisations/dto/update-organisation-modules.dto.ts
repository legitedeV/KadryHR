import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateOrganisationModulesDto {
  @IsOptional()
  @IsBoolean()
  rcp?: boolean;

  @IsOptional()
  @IsBoolean()
  urlopy?: boolean;

  @IsOptional()
  @IsBoolean()
  raporty?: boolean;

  @IsOptional()
  @IsBoolean()
  dyspozycje?: boolean;
}
