# ADR-002: Multi-Tenancy con Shared Database + PostgreSQL RLS

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** Todos (afecta toda la capa de datos)

## Contexto

GymApp es un SaaS multi-tenant donde cada gym es un tenant independiente. Necesitamos aislar sus datos garantizando que un gym nunca pueda acceder a datos de otro, sin tener que desplegar una instancia por gym.

## Decisión

**Estrategia:** Shared Database + Shared Schema + PostgreSQL Row Level Security (RLS)

```sql
-- Activar RLS en cada tabla de negocio
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Política que filtra por gym_id del contexto
CREATE POLICY gym_isolation ON memberships
  USING (gym_id = current_setting('app.current_gym_id')::uuid);

-- TenantMiddleware establece este setting en cada request
SET LOCAL app.current_gym_id = '...';
```

### Implementación en el stack

1. `TenantMiddleware` (NestJS) extrae `gym_id` del JWT o header `x-gym-id` y lo inyecta en el contexto
2. Cada query de Prisma incluye `WHERE gym_id = context.gymId` (doble protección: código + RLS)
3. Tests de tenancy: suite dedicada verifica que gym B no puede leer datos de gym A

### Columna `gym_id` obligatoria
Todas las tablas de negocio deben tener:
```sql
gym_id UUID NOT NULL REFERENCES gyms(id)
```
Excepción: tablas de sistema global (`gyms`, `saas_plans`, `global_exercises`).

## Alternativas consideradas

1. **Database por tenant:** Máximo aislamiento, pero costoso en AWS (> 50 RDS instances para 50 gyms). Operacionalmente complejo.
2. **Schema por tenant:** PostgreSQL soporta múltiples schemas, pero Prisma no tiene soporte nativo elegante para esto. Descartado.
3. **Solo filtro en código (sin RLS):** Riesgo de bug que exponga datos cross-tenant. Inadmisible para un SaaS.

## Consecuencias

**Positivo:**
- Un solo cluster de PostgreSQL para todos los gyms (cost-efficient)
- Migraciones afectan a todos los tenants simultáneamente (simple)
- RLS como red de seguridad adicional al código de aplicación

**Negativo:**
- `pg_cron` jobs deben iterar por `gym_id` (no hay magia de RLS en cron)
- Las queries de `SUPER_ADMIN` necesitan bypass de RLS con role especial
- Performance: índices compuestos `(gym_id, ...)` son obligatorios

**Regla de oro:** Cualquier query que no incluya `gym_id` en el WHERE es un bug de seguridad.
