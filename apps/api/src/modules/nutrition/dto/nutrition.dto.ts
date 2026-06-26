import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';

const GOALS = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'PERFORMANCE'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export class CreatePlanDto {
  @IsUUID() member_id: string;
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @IsIn(GOALS) goal?: string;
  @IsNumber() @Min(0) kcal_target: number;
  @IsNumber() @Min(0) protein_g: number;
  @IsNumber() @Min(0) carbs_g: number;
  @IsNumber() @Min(0) fat_g: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreateFoodItemDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsNumber() @Min(0) kcal_per_100g: number;
  @IsNumber() @Min(0) protein_per_100g: number;
  @IsNumber() @Min(0) carbs_per_100g: number;
  @IsNumber() @Min(0) fat_per_100g: number;
}

export class LogFoodDto {
  @IsUUID() food_item_id: string;
  @IsOptional() @IsUUID() plan_id?: string;
  @IsDateString() date: string;
  @IsString() @IsIn(MEAL_TYPES) meal_type: string;
  @IsNumber() @Min(1) quantity_g: number;
  @IsOptional() @IsString() notes?: string;
}

export class AiSuggestDto {
  @IsOptional() @IsUUID() plan_id?: string;
  @IsOptional() @IsUUID() member_id?: string;
  @IsOptional() @IsString() context?: string;
}
