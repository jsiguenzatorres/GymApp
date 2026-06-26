import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from '../decorators/requires-plan.decorator';
import { PrismaService } from '../../modules/database/prisma.service';

interface JwtUser {
  sub: string;
  role: string;
  gymId?: string;
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlans?.length) return true;

    const req = context.switchToHttp().getRequest<{ user: JwtUser }>();
    const user = req.user;
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (!user.gymId) return false;

    const gym = await this.prisma.gym.findUnique({
      where: { id: user.gymId },
      select: { saas_plan: true, is_active: true },
    });

    if (!gym?.is_active) return false;

    if (!requiredPlans.includes(gym.saas_plan)) {
      throw new ForbiddenException(
        `Esta función requiere el plan ${requiredPlans.join(' o ')}. Plan actual: ${gym.saas_plan}.`,
      );
    }

    return true;
  }
}
