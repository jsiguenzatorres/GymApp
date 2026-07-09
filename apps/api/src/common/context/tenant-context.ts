import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  gymId: string | null;
}

/**
 * Propaga el gym_id del request autenticado a través de toda la cadena de
 * llamadas async (controller -> service -> Prisma), sin tener que pasarlo
 * como parámetro manual en cada método. Poblado por TenantMiddleware.
 */
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getCurrentGymId(): string | null {
  return tenantStorage.getStore()?.gymId ?? null;
}
