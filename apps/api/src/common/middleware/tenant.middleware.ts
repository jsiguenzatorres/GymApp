import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { tenantStorage } from '../context/tenant-context';

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
    let gymId: string | null = null;

    try {
      const token = this.extractToken(req);
      if (token) {
        const payload = this.jwtService.verify(token);
        // SUPER_ADMIN opera entre gyms a propósito (mismo criterio que
        // PlanGuard) — no se le fija gymId, ni al contexto ni al ALS, para
        // no romper sus vistas cross-tenant existentes. El header
        // "x-gym-id" YA NO se usa como fallback: era un valor suministrable
        // por el cliente que, ahora que el ALS realmente filtra queries,
        // se volvería un vector de escalación de privilegios.
        if (payload.role !== 'SUPER_ADMIN' && payload.gymId) {
          gymId = payload.gymId as string;
          req.gymContext = { gymId, userId: payload.sub, role: payload.role };
        }
      }
    } catch {
      // Token inválido o expirado — el guard de auth se encargará de rechazarlo
    }

    tenantStorage.run({ gymId }, () => next());
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
