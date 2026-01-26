import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Query DTO dla listy pracowników:
 * - stronicowanie (page / pageSize)
 * - wyszukiwanie (q)
 * - sortowanie (sort: "createdAt-desc" itd.)
 * - filtr po lokalizacji / statusie
 *
 * Dodatkowo zostawiamy skip/take jako legacy, żeby nic się nie wywaliło.
 */
export class QueryEmployeesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['firstName', 'lastName', 'email', 'createdAt', 'position'])
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'position';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  /**
   * Format: "<field>-<direction>", np. "createdAt-desc"
   */
  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all';

  // Legacy – żeby nic, co przypadkiem używa skip/take, się nie wywaliło.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
