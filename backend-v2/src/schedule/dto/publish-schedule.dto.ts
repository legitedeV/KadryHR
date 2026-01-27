import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PublishScheduleDto {
  @IsString()
  periodId!: string;

  @IsOptional()
  @IsBoolean()
  notify?: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
