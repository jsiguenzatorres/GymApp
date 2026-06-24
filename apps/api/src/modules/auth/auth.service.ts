import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../database/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterGymDto } from './dto/register-gym.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { AuthResponseDto, TwoFactorSetupResponseDto } from './dto/tokens-response.dto';
import { GymEvent, UserRole } from '@gymapp/shared-types';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.encryptionKey = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
  }

  async login(dto: LoginDto, fingerprint?: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        staff: { select: { id: true, gym_id: true, first_name: true, last_name: true } },
        member: { select: { gym_id: true, first_name: true, last_name: true } },
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.two_fa_enabled) {
      if (!dto.totp) {
        throw new UnauthorizedException('two_fa_required');
      }
      const secret = this.decryptSecret(user.two_fa_secret!);
      const isValid = authenticator.verify({ token: dto.totp, secret });
      if (!isValid) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    const gymId = user.staff?.gym_id ?? user.member?.gym_id;
    const staffId = user.staff?.id ?? undefined;
    const firstName = user.staff?.first_name ?? user.member?.first_name;
    const lastName = user.staff?.last_name ?? user.member?.last_name;

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
      gymId,
      staffId,
    );

    const rtHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refresh_token_hash: rtHash,
        last_login_at: new Date(),
        last_login_ip: fingerprint,
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        gymId: gymId ?? undefined,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        twoFaEnabled: user.two_fa_enabled,
      },
    };
  }

  async registerGym(dto: RegisterGymDto): Promise<AuthResponseDto> {
    const [existingSlug, existingEmail] = await Promise.all([
      this.prisma.gym.findUnique({ where: { slug: dto.gymSlug } }),
      this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } }),
    ]);

    if (existingSlug) throw new ConflictException('El identificador del gym ya está en uso');
    if (existingEmail) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const result = await this.prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          name: dto.gymName,
          slug: dto.gymSlug,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          country: dto.country ?? 'SV',
          timezone: dto.timezone ?? 'America/El_Salvador',
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password_hash: passwordHash,
          role: 'GYM_OWNER',
          email_verified: false,
        },
      });

      await tx.staff.create({
        data: {
          gym_id: gym.id,
          user_id: user.id,
          first_name: dto.firstName,
          last_name: dto.lastName,
          phone: dto.phone,
        },
      });

      return { gym, user };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      UserRole.GYM_OWNER,
      result.gym.id,
    );

    const rtHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.prisma.user.update({
      where: { id: result.user.id },
      data: { refresh_token_hash: rtHash },
    });

    this.eventEmitter.emit(GymEvent.MEMBER_CREATED, {
      gymId: result.gym.id,
      note: `Gym registrado: ${result.gym.name}`,
    });

    this.logger.log(`Gym creado: ${result.gym.name} (${result.gym.slug})`);

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: 'GYM_OWNER',
        gymId: result.gym.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        twoFaEnabled: false,
      },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, is_active: true },
      include: {
        staff: { select: { id: true, gym_id: true } },
        member: { select: { gym_id: true } },
      },
    });

    if (!user?.refresh_token_hash) {
      throw new UnauthorizedException('Sesión expirada');
    }

    const rtHash = createHash('sha256').update(refreshToken).digest('hex');
    if (user.refresh_token_hash !== rtHash) {
      // Reuse detectado: invalidar sesión completa
      await this.prisma.user.update({
        where: { id: userId },
        data: { refresh_token_hash: null },
      });
      throw new UnauthorizedException('Sesión inválida — inicia sesión nuevamente');
    }

    const gymId = user.staff?.gym_id ?? user.member?.gym_id;
    const staffId = user.staff?.id ?? undefined;
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
      gymId,
      staffId,
    );

    const newRtHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: newRtHash },
    });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: null },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, is_active: true },
      include: {
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            avatar_url: true,
            gym: { select: { id: true, name: true, slug: true, saas_plan: true, logo_url: true } },
          },
        },
        member: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            status: true,
            loyalty_level: true,
            gym_id: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      twoFaEnabled: user.two_fa_enabled,
      createdAt: user.created_at,
      staff: user.staff,
      member: user.member,
    };
  }

  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.two_fa_enabled) throw new BadRequestException('2FA ya está activado');

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'GymApp', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    const backupCodes = Array.from({ length: 10 }, () =>
      randomBytes(4).toString('hex').toUpperCase(),
    );
    const backupHashes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));

    const encryptedSecret = this.encryptSecret(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { two_fa_secret: encryptedSecret, two_fa_backup_codes: backupHashes },
    });

    return { secret, qrCodeUrl, backupCodes };
  }

  async verifyAndEnableTwoFactor(userId: string, totp: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.two_fa_secret)
      throw new BadRequestException('Configura 2FA primero con /auth/2fa/setup');
    if (user.two_fa_enabled) throw new BadRequestException('2FA ya está activado');

    const secret = this.decryptSecret(user.two_fa_secret);
    if (!authenticator.verify({ token: totp, secret })) {
      throw new UnauthorizedException('Código TOTP inválido');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { two_fa_enabled: true } });
  }

  async disableTwoFactor(userId: string, totp: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.two_fa_enabled || !user.two_fa_secret) {
      throw new BadRequestException('2FA no está activado');
    }

    const secret = this.decryptSecret(user.two_fa_secret);
    if (!authenticator.verify({ token: totp, secret })) {
      throw new UnauthorizedException('Código TOTP inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { two_fa_enabled: false, two_fa_secret: null, two_fa_backup_codes: [] },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // No revelar si el email existe

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { reset_token_hash: tokenHash, reset_token_exp: expiresAt },
    });

    // Sprint 1.6: enviar via SendGrid/Resend. Por ahora loguear en dev.
    this.logger.log(`[DEV] Password reset token para ${email}: ${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: { reset_token_hash: tokenHash, reset_token_exp: { gt: new Date() } },
    });

    if (!user) throw new BadRequestException('Token inválido o expirado');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_exp: null,
        refresh_token_hash: null, // Invalidar sesiones activas
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    gymId?: string | null,
    staffId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, email, role, gymId: gymId ?? undefined, staffId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: '30d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private encryptSecret(text: string): string {
    const iv = randomBytes(16);
    const key = createHash('sha256').update(this.encryptionKey).digest();
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptSecret(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = createHash('sha256').update(this.encryptionKey).digest();
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
