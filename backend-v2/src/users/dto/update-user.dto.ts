import { PartialType } from '@nestjs/mapped-types';
import { Role } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  employeeId?: string;
}
