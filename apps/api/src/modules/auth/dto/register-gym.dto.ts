import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterGymDto {
  @ApiProperty({ example: 'EliteFit Gym', maxLength: 200 })
  @IsString()
  @MinLength(3, { message: 'El nombre del gym debe tener al menos 3 caracteres' })
  @MaxLength(200)
  gymName: string;

  @ApiProperty({ example: 'elitefit', description: 'Solo letras minúsculas, números y guiones' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  gymSlug: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Martínez' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'carlos@elitefit.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ minLength: 8, description: 'Debe incluir mayúscula, minúscula y número' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiPropertyOptional({ example: '+503 7777-8888' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'SV', description: 'Código ISO 3166-1 alpha-2' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ example: 'America/El_Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}
