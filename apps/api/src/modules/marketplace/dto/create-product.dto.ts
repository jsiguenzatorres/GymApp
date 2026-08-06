import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class OrderItemDto {
  @IsUUID() product_id: string;
  @IsInt() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @IsUUID() member_id: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString() status: string;
}

export class AdjustStockDto {
  @IsInt() delta: number; // positivo = entrada/reabastecimiento, negativo = salida/ajuste
  @IsOptional() @IsString() @MaxLength(200) reason?: string;
}
