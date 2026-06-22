import {
  IsUUID,
  IsInt,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LogSetDto {
  @IsUUID()
  exerciseId: string;

  @IsInt()
  @Min(1)
  setNumber: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSec?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceM?: number;

  @IsOptional()
  @IsBoolean()
  isWarmup?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FinishSessionDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  perceivedEffort?: number;
}
