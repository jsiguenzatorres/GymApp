import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  IsDateString,
  Min,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@gymapp/shared-types';

export class CreatePaymentDto {
  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['CF', 'CCF'])
  invoiceType?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  // Comprobante manual — desglose de impuestos (DTE-lite)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  voucherNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  // Comprobante adjunto al crear el pago manual (opcional) — sin extracción
  // IA, es solo evidencia adjunta a la transacción que el staff ya digitó.
  @IsOptional()
  @IsString()
  voucherDocument?: string; // data:image/{jpeg|png|webp}|application/pdf;base64,...
}

export class AttachVoucherDto {
  @IsString()
  document: string; // data:image/{jpeg|png|webp}|application/pdf;base64,...
}

export class UploadPaymentVoucherDto {
  @IsUUID()
  memberId: string;

  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsString()
  document: string; // data:image/{jpeg|png|webp}|application/pdf;base64,...
}

export class ConfirmPaymentDraftDto {
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsIn(['CF', 'CCF'])
  invoiceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  voucherNumber?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPaymentDraftDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
