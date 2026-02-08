import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class OrderEmployeesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  orderedEmployeeIds: string[];

  @IsOptional()
  @IsUUID('4')
  periodId?: string;
}
