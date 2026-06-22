import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutGoal } from '@gymapp/shared-types';

export class WorkoutBlockDto {
  @IsUUID()
  exerciseId: string;

  @IsOptional()
  @IsString()
  blockType?: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsInt()
  @Min(1)
  @Max(20)
  sets: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  repsMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  repsMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WorkoutDayDto {
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutBlockDto)
  blocks: WorkoutBlockDto[];
}

export class CreatePlanDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkoutGoal)
  goal?: WorkoutGoal;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek: number;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutDayDto)
  days: WorkoutDayDto[];
}
