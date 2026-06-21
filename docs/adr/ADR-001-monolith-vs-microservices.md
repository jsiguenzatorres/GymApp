# ADR-001: Modular Monolith en P1–P2, Microservices Selectivos en P3+

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** Todos

## Contexto

Al iniciar el proyecto tenemos un equipo pequeño (2–5 desarrolladores), requisito de velocidad de entrega y necesidad de validar el producto en el mercado rápidamente. La arquitectura de microservices habría ofrecido escalabilidad pero a un costo prohibitivo de complejidad inicial.

## Decisión

**Fase 1–2 (MVP y Growth):** Modular Monolith desplegado como un solo proceso NestJS.
- Módulos NestJS como límites de dominio (bounded contexts)
- Event Bus interno con `GymEvent` enum para comunicación desacoplada entre módulos
- Cada módulo en `apps/api/src/modules/[nombre]/` con su propio service, controller, prisma schema

**Fase 3+ (Scale):** Extracción selectiva de servicios con alta carga o ciclo de deploy independiente:
- `NotificationService` → microservicio (alto volumen, spike de carga en campañas)
- `AIService` (ARIA/ZEUS) → microservicio (alto costo computacional, rate limits independientes)
- El resto permanece como monolito hasta demostrar necesidad real de extraer

## Alternativas consideradas

1. **Microservices desde el inicio:** Mayor complejidad operacional, requiere service mesh, distributed tracing desde día 1. Excesivo para el tamaño del equipo.
2. **Monolito sin modularización:** Deuda técnica difícil de pagar después. No elegida.
3. **Serverless (Lambda/Cloudflare Workers):** Cold starts problemáticos para acceso físico y sockets real-time. Descartada.

## Consecuencias

**Positivo:**
- Velocity alta en P1–P2 (un solo proceso, un solo deploy)
- Transacciones ACID entre módulos sin 2PC
- Debugging simplificado (trazas en un solo proceso)
- Railway.app suficiente en P1–P2

**Negativo:**
- Deploy de un módulo requiere redeploy de todo (mitigado con Railway's zero-downtime)
- En P3 la extracción de servicios tendrá costo de refactoring

**Constraint clave:** Los módulos NUNCA deben importar entre sí directamente. Solo comunicación via EventBus o via llamada al Service registrado en el módulo dueño del dato.
