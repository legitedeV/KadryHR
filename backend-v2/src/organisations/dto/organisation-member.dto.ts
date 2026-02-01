import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateOrganisationInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsUUID('4')
  locationId?: string;
}

export class UpdateOrganisationMemberRoleDto {
  @IsEnum(Role)
  role!: Role;
}
