import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  geoLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  geoLng?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(5000)
  geoRadiusMeters?: number;

  @IsOptional()
  @IsBoolean()
  rcpEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  rcpAccuracyMaxMeters?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds?: string[];
}
