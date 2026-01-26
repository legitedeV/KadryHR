import { IsString, Length } from 'class-validator';

export class NewsletterTokenDto {
  @IsString()
  @Length(10, 200)
  token!: string;
}
