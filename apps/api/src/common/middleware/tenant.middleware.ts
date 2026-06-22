import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

export interface GymContext {
  gymId: string;
  userId: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      gymContext?: GymContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      const token = this.extractToken(req);
      if (!token) {
        next();
        return;
      }

      const payload = this.jwtService.verify(token);
      const gymId = payload.gymId ?? req.headers['x-gym-id'];

      if (!gymId) {
        next();
        return;
      }

      req.gymContext = {
        gymId: gymId as string,
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      // Token inválido o expirado — el guard de auth se encargará de rechazarlo
    }

    next();
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}

/**
 * Helper para obtener gymId del contexto y fallar rápido si no hay contexto.
 * Úsalo al inicio de cada método de servicio que opere sobre datos de un gym.
 */
export function requireGymContext(req: Request): GymContext {
  if (!req.gymContext?.gymId) {
    throw new UnauthorizedException('Se requiere contexto de gym (gymId)');
  }
  return req.gymContext;
}
