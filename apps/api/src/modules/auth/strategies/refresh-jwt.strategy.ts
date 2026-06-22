import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { RefreshPayload } from '../interfaces/jwt-payload.interface';

export interface RefreshUser {
  userId: string;
  refreshToken: string;
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshPayload): RefreshUser {
    const refreshToken = (req.body as Record<string, string>)?.refreshToken;
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token de refresh inválido');
    }
    return { userId: payload.sub, refreshToken };
  }
}
