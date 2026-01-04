import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateInvitationDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
