import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsBoolean,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'X'])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsIn(['walk-in', 'referral', 'social_media', 'web', 'other'])
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Identidad y facturación (El Salvador) — capturados al registrar pagos con DTE-lite
export class MemberFiscalInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(15)
  dui?: string;

  @IsOptional()
  @IsDateString()
  duiExpiration?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isTaxpayer?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nrc?: string;
}

export class UpdateMemberDto extends MemberFiscalInfoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['M', 'F', 'X'])
  gender?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
