import { IsString } from 'class-validator';

export class AuthUserDto {
  id: string;
  email: string;
  role: string;
  gymId?: string;
  firstName?: string;
  lastName?: string;
  twoFaEnabled: boolean;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export class TwoFactorSetupResponseDto {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
