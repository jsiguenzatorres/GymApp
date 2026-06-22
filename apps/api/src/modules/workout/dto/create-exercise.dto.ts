import { IsString, IsOptional, IsArray, IsBoolean, MaxLength, IsEnum } from 'class-validator';
import { ExerciseCategory, Equipment, MuscleGroup } from '@gymapp/shared-types';

export class CreateExerciseDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsEnum(MuscleGroup, { each: true })
  muscleGroups: MuscleGroup[];

  @IsOptional()
  @IsArray()
  @IsEnum(MuscleGroup, { each: true })
  secondaryMuscles?: MuscleGroup[];

  @IsOptional()
  @IsArray()
  @IsEnum(Equipment, { each: true })
  equipment?: Equipment[];

  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
