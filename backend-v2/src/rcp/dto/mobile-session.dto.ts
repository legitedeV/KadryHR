import { IsNotEmpty, IsString } from 'class-validator';

export class MobileRcpSessionDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
