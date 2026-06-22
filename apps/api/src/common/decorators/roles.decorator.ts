import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@gymapp/shared-types';

export const ROLES_KEY = 'roles';

/** Decorator: define qué roles tienen acceso al endpoint */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
