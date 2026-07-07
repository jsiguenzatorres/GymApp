import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';

export const GOALS = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'PERFORMANCE'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DIETAS_BASE = [
  'omnivoro',
  'vegetariano',
  'vegano',
  'pescetariano',
  'keto',
  'paleo',
  'mediterranea',
  'flexitariano',
];
const PRESUPUESTOS = ['bajo', 'medio', 'alto'];
const TIEMPOS_COCINA = ['menos_15_min', '15_30_min', '30_60_min', 'sin_limite'];
export const ACTIVITY_LEVELS = ['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo'];

export class CreatePlanDto {
  @IsUUID() member_id: string;
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @IsIn(GOALS) goal?: string;
  @IsNumber() @Min(0) kcal_target: number;
  @IsNumber() @Min(0) protein_g: number;
  @IsNumber() @Min(0) carbs_g: number;
  @IsNumber() @Min(0) fat_g: number;
  @IsOptional() @IsString() notes?: string;
  // Basis del motor TMB/TDEE (D-26) — solo se envían si el plan se armó con la calculadora
  @IsOptional() @IsNumber() tmb_kcal?: number;
  @IsOptional() @IsString() tmb_formula_used?: string;
  @IsOptional() @IsNumber() tdee_kcal?: number;
  @IsOptional() @IsNumber() factor_actividad?: number;
}

export class UpsertNutritionProfileDto {
  @IsOptional() @IsString() @IsIn(DIETAS_BASE) dieta_base?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) alergias?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) intolerancias?: string[];
  @IsOptional() @IsString() @MaxLength(30) restricciones_religiosas?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) alimentos_evitar?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) alimentos_favoritos?: string[];
  @IsOptional() @IsString() @IsIn(PRESUPUESTOS) presupuesto?: string;
  @IsOptional() @IsString() @IsIn(TIEMPOS_COCINA) tiempo_cocina?: string;
  @IsOptional() @IsNumber() @Min(0) height_cm?: number;
  @IsOptional() @IsString() @IsIn(ACTIVITY_LEVELS) activity_level?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) condiciones_medicas?: string[];
  @IsOptional() @IsBoolean() requiere_supervision_clinica?: boolean;
  @IsOptional() @IsBoolean() antecedente_tca_declarado?: boolean;
  @IsOptional() @IsBoolean() tca_clinical_review_completed?: boolean;
}

export class CalculateTmbTdeeDto {
  @IsUUID() memberId: string;
  @IsString() @IsIn(GOALS) goal: string;
}

export class ReviewRiskAlertDto {
  @IsOptional() @IsString() resolution_notes?: string;
}

export class UploadLabResultDto {
  @IsUUID() memberId: string;
  @IsString() document: string; // data:image/{jpeg|png|webp}|application/pdf;base64,...
  @IsOptional() @IsDateString() lab_date?: string;
}

export class ReviewLabResultDto {
  @IsOptional() @IsString() nutritionist_notes?: string;
  @IsOptional() @IsBoolean() plan_adjusted_as_result?: boolean;
}

export class CreateFoodItemDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsNumber() @Min(0) kcal_per_100g: number;
  @IsNumber() @Min(0) protein_per_100g: number;
  @IsNumber() @Min(0) carbs_per_100g: number;
  @IsNumber() @Min(0) fat_per_100g: number;
}

export class UpdateFoodItemDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(100) brand?: string;
  @IsOptional() @IsNumber() @Min(0) kcal_per_100g?: number;
  @IsOptional() @IsNumber() @Min(0) protein_per_100g?: number;
  @IsOptional() @IsNumber() @Min(0) carbs_per_100g?: number;
  @IsOptional() @IsNumber() @Min(0) fat_per_100g?: number;
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
