import { IsArray, IsUUID } from 'class-validator';

export class UpdateLocationEmployeesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds!: string[];
}
