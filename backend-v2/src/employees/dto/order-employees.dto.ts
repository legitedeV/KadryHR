import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class OrderEmployeesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayUnique()
  orderedEmployeeIds: string[];
}
