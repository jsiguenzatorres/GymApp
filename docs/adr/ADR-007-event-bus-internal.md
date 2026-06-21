# ADR-007: Event Bus Interno con GymEvent Enum

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** Todos los módulos NestJS

## Contexto

En un modular monolith, los módulos necesitan comunicarse sin acoplarse directamente. Por ejemplo, cuando un miembro hace check-in (`GYM-MOD-ACCESS`), el módulo de gamificación debe otorgar puntos y el CRM debe actualizar el risk score. Si `AccessModule` importa directamente `GamificationService` y `CrmService`, el acoplamiento se vuelve insostenible.

## Decisión

**NestJS EventEmitter** (wrapper sobre EventEmitter2) con un enum tipado de eventos.

```typescript
// packages/shared-types/src/gym-events.ts
export enum GymEvent {
  // Acceso
  MEMBER_CHECKED_IN         = 'member.checked_in',
  MEMBER_ACCESS_DENIED      = 'member.access_denied',
  // Membresías
  MEMBERSHIP_CREATED        = 'membership.created',
  MEMBERSHIP_ACTIVATED      = 'membership.activated',
  MEMBERSHIP_EXPIRED        = 'membership.expired',
  MEMBERSHIP_FROZEN         = 'membership.frozen',
  MEMBERSHIP_CANCELLED      = 'membership.cancelled',
  // Billing
  PAYMENT_SUCCEEDED         = 'payment.succeeded',
  PAYMENT_FAILED            = 'payment.failed',
  PAYMENT_RECOVERED         = 'payment.recovered',
  // Workout
  SESSION_COMPLETED         = 'workout.session_completed',
  PR_ACHIEVED               = 'workout.pr_achieved',
  PLAN_ASSIGNED             = 'workout.plan_assigned',
  // CRM / Risk
  RISK_SCORE_UPDATED        = 'crm.risk_score_updated',
  RISK_SCORE_HIGH           = 'crm.risk_score_high',
  // Gamificación
  POINTS_EARNED             = 'gamification.points_earned',
  BADGE_UNLOCKED            = 'gamification.badge_unlocked',
  LEVEL_UP                  = 'gamification.level_up',
  // Marketplace
  ORDER_COMPLETED           = 'marketplace.order_completed',
  // Staff
  APPOINTMENT_CONFIRMED     = 'appointment.confirmed',
  APPOINTMENT_CANCELLED     = 'appointment.cancelled',
}
```

### Patrón de emisión
```typescript
// AccessService emite, no importa a GamificationService
this.eventEmitter.emit(GymEvent.MEMBER_CHECKED_IN, {
  gymId, memberId, doorId, timestamp, accessLogId
} satisfies MemberCheckedInPayload);
```

### Patrón de escucha
```typescript
// GamificationService escucha, no importa a AccessService
@OnEvent(GymEvent.MEMBER_CHECKED_IN)
async handleCheckedIn(payload: MemberCheckedInPayload) {
  await this.awardPoints(payload.memberId, PointEvent.CHECK_IN);
}
```

## Por qué NO usar una solución de mensajería externa (RabbitMQ, Kafka)

- En P1–P2 corremos un solo proceso. Añadir un broker externo es overhead sin beneficio.
- EventEmitter2 es síncrono en el mismo proceso → debugging trivial.
- En P3, cuando se extraigan microservicios, se migrará solo los eventos cross-servicio a NATS o RabbitMQ. Los eventos intra-monolito permanecen con EventEmitter.

## Consecuencias

**Positivo:**
- Módulos completamente desacoplados: access, billing, gamification, CRM no se importan entre sí
- Añadir un nuevo handler no requiere tocar el emisor
- Debugging: EventEmitter2 tiene logging de eventos

**Negativo:**
- Eventos síncronos en el mismo thread — si el handler falla, el caller puede ver el error
- Solución: handlers críticos deben usar `try/catch` y no propagar errores al emisor
- En P3, algunos eventos necesitarán migración a broker asíncrono externo
