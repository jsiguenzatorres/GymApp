import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterGymDto } from './dto/register-gym.dto';
import { VerifyTotpDto } from './dto/two-factor.dto';
import { RefreshTokenDto } from './dto/tokens-response.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshJwtGuard } from '../../common/guards/refresh-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { RefreshUser } from './strategies/refresh-jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const fingerprint = req.ip ?? req.headers['x-forwarded-for']?.toString();
    return this.authService.login(dto, fingerprint);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo gym + owner (onboarding)' })
  register(@Body() dto: RegisterGymDto) {
    return this.authService.registerGym(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  refresh(@Req() req: Request & { user: RefreshUser }, @Body() _dto: RefreshTokenDto) {
    return this.authService.refreshTokens(req.user.userId, req.user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión — invalida el refresh token' })
  logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  // ── 2FA ────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar configuración de 2FA — genera secreto y QR' })
  setupTwoFactor(@CurrentUser() user: JwtPayload) {
    return this.authService.setupTwoFactor(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar TOTP y activar 2FA' })
  verifyAndEnableTwoFactor(@CurrentUser() user: JwtPayload, @Body() dto: VerifyTotpDto) {
    return this.authService.verifyAndEnableTwoFactor(user.sub, dto.totp);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar 2FA' })
  disableTwoFactor(@CurrentUser() user: JwtPayload, @Body() dto: VerifyTotpDto) {
    return this.authService.disableTwoFactor(user.sub, dto.totp);
  }

  // ── Password reset ──────────────────────────────────────────────────────────

  @Public()
  @Post('password/reset-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña por email' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
