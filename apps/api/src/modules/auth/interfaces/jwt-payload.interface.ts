import type { UserRole } from '@gymapp/shared-types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  gymId?: string;
  staffId?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}
