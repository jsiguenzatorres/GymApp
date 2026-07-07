import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';

const DISCOUNT_TYPES = ['percentage', 'fixed'];

export class CreateCouponDto {
  @IsString() @MaxLength(50) code: string;
  @IsString() @MaxLength(100) name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() @IsIn(DISCOUNT_TYPES) discount_type: string;
  @IsNumber() @Min(0) discount_value: number;
  @IsOptional() @IsArray() @IsString({ each: true }) applies_to_type_ids?: string[];
  @IsOptional() @IsDateString() starts_at?: string;
  @IsOptional() @IsDateString() expires_at?: string;
  @IsOptional() @IsNumber() @Min(1) max_uses_total?: number;
  @IsOptional() @IsNumber() @Min(1) max_uses_per_member?: number;
  @IsOptional() @IsBoolean() first_time_only?: boolean;
}

export class UpdateCouponDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @IsIn(DISCOUNT_TYPES) discount_type?: string;
  @IsOptional() @IsNumber() @Min(0) discount_value?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) applies_to_type_ids?: string[];
  @IsOptional() @IsDateString() starts_at?: string;
  @IsOptional() @IsDateString() expires_at?: string;
  @IsOptional() @IsNumber() @Min(1) max_uses_total?: number;
  @IsOptional() @IsNumber() @Min(1) max_uses_per_member?: number;
  @IsOptional() @IsBoolean() first_time_only?: boolean;
  @IsOptional() @IsBoolean() is_active?: boolean;
}

export class ValidateCouponDto {
  @IsString() code: string;
  @IsString() membershipTypeId: string;
  @IsOptional() @IsString() memberId?: string;
}
