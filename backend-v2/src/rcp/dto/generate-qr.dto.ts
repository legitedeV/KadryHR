import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  @IsNotEmpty()
  locationId: string;
}
