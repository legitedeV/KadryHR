import { Transform } from 'class-transformer';
import { IsArray, IsISO8601, IsOptional, IsString } from 'class-validator';

const toArray = (key: string) => {
  return ({
    value,
    obj,
  }: {
    value?: string | string[];
    obj?: Record<string, string | string[]>;
  }) => {
    const raw = value ?? (obj ? obj[`${key}[]`] : undefined);
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw : [raw];
  };
};

export class QueryScheduleSummaryDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @Transform(toArray('locationIds'))
  @IsArray()
  @IsString({ each: true })
  locationIds?: string[];

  @IsOptional()
  @Transform(toArray('positionIds'))
  @IsArray()
  @IsString({ each: true })
  positionIds?: string[];
}
