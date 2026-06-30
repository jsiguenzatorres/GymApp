import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsString() @MaxLength(200) name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(0) stock: number;
  @IsOptional() @IsString() @MaxLength(50) sku?: string;
  @IsOptional() @IsString() image_url?: string;
  @IsOptional() @IsUUID() category_id?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;

  // Información nutricional (opcional, todos pueden ser null)
  @IsOptional() @IsString() @MaxLength(50) serving_size?: string;
  @IsOptional() @IsNumber() @Min(0) calories_kcal?: number;
  @IsOptional() @IsNumber() @Min(0) protein_g?: number;
  @IsOptional() @IsNumber() @Min(0) carbs_g?: number;
  @IsOptional() @IsNumber() @Min(0) fat_g?: number;
  @IsOptional() @IsNumber() @Min(0) fiber_g?: number;
  @IsOptional() @IsNumber() @Min(0) sugar_g?: number;
  @IsOptional() @IsNumber() @Min(0) sodium_mg?: number;
}

export class CreateCategoryDto {
  @IsString() @MaxLength(100) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image_url?: string;
  @IsOptional() @IsNumber() sort_order?: number;
}

export class CreateOrderDto {
  @IsUUID() member_id: string;
  @IsOptional() @IsString() notes?: string;
  items: { product_id: string; quantity: number }[];
}

export class UpdateOrderStatusDto {
  @IsString() status: string;
}
