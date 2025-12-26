import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchEmployeesDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all';
}
