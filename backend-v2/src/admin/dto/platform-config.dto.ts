import { IsObject, IsOptional } from 'class-validator';

export class UpdatePlatformConfigDto {
  @IsOptional()
  @IsObject()
  frontendConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  backendConfig?: Record<string, unknown>;
}
