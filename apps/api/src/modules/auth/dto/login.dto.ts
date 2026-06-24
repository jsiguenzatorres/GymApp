import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@elitefit.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Contraseña muy corta' })
  password: string;

  @ApiPropertyOptional({
    description: 'Código TOTP de 6 dígitos (requerido si 2FA está activo)',
    example: '123456',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d{6}$/.test(value) ? value : undefined,
  )
  @IsString()
  @Length(6, 6, { message: 'El código 2FA debe tener exactamente 6 dígitos' })
  totp?: string;
}
