import { IsEnum, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  @IsIn([Role.MANAGER, Role.ADMIN, Role.EMPLOYEE], {
    message: 'Role must be MANAGER, ADMIN, or EMPLOYEE',
  })
  role!: Role;
}
