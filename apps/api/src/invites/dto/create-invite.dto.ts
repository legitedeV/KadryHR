import { MembershipRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(MembershipRole)
  role: MembershipRole;
}
