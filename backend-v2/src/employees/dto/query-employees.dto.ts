import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

type EmployeeSortField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'createdAt'
  | 'position';

type SortOrder = 'asc' | 'desc';

export class QueryEmployeesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'createdAt', 'position'])
  sortBy?: EmployeeSortField;

  @IsOptional()
  @Type(() => String)
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder;
}
