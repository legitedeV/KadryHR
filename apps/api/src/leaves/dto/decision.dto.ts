import { IsOptional, IsString, Length } from 'class-validator';

export class DecisionDto {
  @IsOptional()
  @IsString()
  @Length(0, 300)
  note?: string;
}
