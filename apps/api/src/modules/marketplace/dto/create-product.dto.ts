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
