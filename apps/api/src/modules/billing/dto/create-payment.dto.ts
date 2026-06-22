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
}
