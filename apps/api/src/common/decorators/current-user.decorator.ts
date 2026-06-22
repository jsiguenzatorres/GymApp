import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  gymId: string;
  role: string;
  iat: number;
  exp: number;
}

/** @CurrentUser() — inyecta el payload del JWT en el parámetro del handler */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
