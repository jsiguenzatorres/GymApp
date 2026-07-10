import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const OVERRIDE_REASONS = [
  'CASH_PAYMENT_NOW',
  'GRACE_PERIOD',
  'TECHNICAL_ISSUE',
  'OTHER',
] as const;

export class OverrideAccessDto {
  @IsUUID() memberId: string;
  @IsIn(OVERRIDE_REASONS) reason: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
