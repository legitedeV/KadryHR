import { TimeEntrySource, TimeEntryType } from "@prisma/client";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ManualEntryDto {
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsEnum(TimeEntryType)
  type!: TimeEntryType;

  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsEnum(TimeEntrySource)
  source?: TimeEntrySource;
}
