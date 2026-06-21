# ADR-003: REST para APIs Externas + tRPC para Web Admin Interno

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** `apps/api`, `apps/web`, `apps/mobile`

## Contexto

Necesitamos una estrategia de API que sirva a:
1. **App móvil** (React Native) — clientes externos con posibles versiones desactualizadas
2. **Panel web admin** (Next.js) — cliente interno con control total sobre el servidor
3. **Futuros partners** (Fase 4) — integración de terceros

Adicionalmente, los tipos entre frontend y backend deben estar sincronizados automáticamente para evitar errores en runtime.

## Decisión

**Dual approach:**

### REST API (público)
- Base: `/api/v1/`
- Documentado con OpenAPI/Swagger
- Versionado en URL para compatibilidad con apps móviles en tiendas
- Usado por: app móvil, webhooks entrantes (Stripe, MercadoPago), futuros partners
- Autenticación: JWT Bearer

### tRPC v11 (interno web admin)
- Montado en `/trpc/`
- Type-safe end-to-end sin generación de código
- Usado por: `apps/web` (Next.js) únicamente
- Ventaja: si cambias la firma de un procedimiento, el compilador falla en el cliente inmediatamente
- Desventaja: no puede ser consumido por terceros sin wrappers

```typescript
// Ejemplo: el tipo fluye automáticamente sin codegen
// En el servidor (api):
export const memberRouter = router({
  getActive: protectedProcedure
    .input(z.object({ gymId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.members.findMany({ where: { gym_id: input.gymId } });
    }),
});

// En el cliente (web) — TypeScript sabe el retorno exacto:
const { data } = trpc.member.getActive.useQuery({ gymId });
```

### WebSocket (Socket.io)
- Para notificaciones real-time y sesiones de workout en progreso
- Namespace `/notifications` y `/workout-session`

## Alternativas consideradas

1. **Solo REST:** Requeriría generación de tipos (OpenAPI → TypeScript) para tener type-safety. Más fricción.
2. **Solo tRPC:** No compatible con app móvil (clientes no-web) ni con webhooks externos sin adapters.
3. **GraphQL:** Overkill para este caso. Complejidad de N+1 queries, tooling pesado.

## Consecuencias

**Positivo:**
- Type safety completo en web admin sin overhead de codegen
- API pública versionada para compatibilidad a largo plazo con mobile
- Schemas Zod reutilizados en ambas capas (via `packages/shared-schemas`)

**Negativo:**
- Duplicación de lógica ocasional (endpoint REST + procedimiento tRPC pueden hacer lo mismo)
- Desarrolladores deben conocer ambas APIs
