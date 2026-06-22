# ⚙️ ARQUITECTURA TÉCNICA & STACK TECNOLÓGICO

## App Integral de Gimnasio de Élite — Documento de Referencia para Desarrollo

### Versión 1.0 · Junio 2026 · CONFIDENCIAL

---

> **Audiencia:** Equipo de desarrollo, CTO, arquitecto de software  
> **Propósito:** Referencia técnica definitiva antes de escribir la primera línea de código  
> **Principio rector:** _"Construir una vez, escalar a cientos de gimnasios sin rediseñar"_

---

## 📋 TABLA DE CONTENIDO

1. [Decisiones Arquitectónicas Fundamentales](#1-decisiones-arquitectónicas-fundamentales)
2. [Vista General del Sistema](#2-vista-general-del-sistema)
3. [Stack Tecnológico Definitivo](#3-stack-tecnológico-definitivo)
4. [Arquitectura del Backend](#4-arquitectura-del-backend)
5. [Arquitectura Multi-Tenant](#5-arquitectura-multi-tenant)
6. [Arquitectura de la App Móvil](#6-arquitectura-de-la-app-móvil)
7. [Arquitectura del Panel Web (Admin)](#7-arquitectura-del-panel-web-admin)
8. [Base de Datos — Diseño Unificado](#8-base-de-datos--diseño-unificado)
9. [Sistema de Autenticación & Autorización](#9-sistema-de-autenticación--autorización)
10. [Sistema de Notificaciones Unificado](#10-sistema-de-notificaciones-unificado)
11. [Integración de Inteligencia Artificial](#11-integración-de-inteligencia-artificial)
12. [Infraestructura Cloud & DevOps](#12-infraestructura-cloud--devops)
13. [Seguridad & Cumplimiento](#13-seguridad--cumplimiento)
14. [APIs & Integraciones Externas](#14-apis--integraciones-externas)
15. [Estrategia de Escalabilidad](#15-estrategia-de-escalabilidad)
16. [Plan de Implementación por Fases](#16-plan-de-implementación-por-fases)
17. [Estándares de Código & Convenciones](#17-estándares-de-código--convenciones)
18. [Glosario Técnico](#18-glosario-técnico)

---

## 1. DECISIONES ARQUITECTÓNICAS FUNDAMENTALES

Estas decisiones son las más importantes del proyecto. Cambiarlas después de iniciar el desarrollo tiene un costo muy alto. Cada una fue evaluada con sus pros y contras.

### 1.1 Monolito Modular vs. Microservicios

```
DECISIÓN: Monolito Modular en Fase 1 → Microservicios selectivos en Fase 3

RAZONAMIENTO:
  Microservicios desde el inicio sería un error clásico de premature optimization:
  - Añade complejidad operacional enorme (Kubernetes, service mesh, distributed tracing)
  - Requiere un equipo DevOps dedicado desde el día 1
  - El 80% de startups que inician con microservicios los colapsan en el primer año
  - Netflix, Uber, Amazon: todos empezaron monolíticos y migraron gradualmente

  Monolito Modular da lo mejor de ambos mundos:
  ✅ Un solo repositorio, deployment simple
  ✅ Módulos internamente desacoplados (preparados para extraer)
  ✅ Sin latencia de red entre módulos
  ✅ Transacciones ACID entre módulos sin saga patterns
  ✅ Testing simplificado
  ✅ Un equipo pequeño puede moverlo rápido

ARQUITECTURA ELEGIDA:
  Monolito modular con:
  - Módulos internamente independientes (cada módulo = carpeta con su dominio completo)
  - Comunicación entre módulos vía interfaces TypeScript (no HTTP)
  - Base de datos compartida con schemas separados por módulo
  - APIs externas bien definidas desde el día 1

CUÁNDO EXTRAER A MICROSERVICIO (Fase 3+):
  - Módulo de IA/ML (cómputo costoso, escala independiente)
  - Módulo de notificaciones (alto volumen, latencia crítica)
  - Módulo de billing (compliance, auditoría independiente)
```

### 1.2 REST vs. GraphQL vs. tRPC

```
DECISIÓN: REST para APIs externas + tRPC para comunicación interna app-server

RAZONAMIENTO REST (APIs externas/públicas):
  ✅ Estándar universal — cualquier integración lo entiende
  ✅ Cacheable (CDN puede cachear GET requests)
  ✅ Bien soportado en webhooks de Stripe, WhatsApp, etc.
  ✅ Documentable con OpenAPI/Swagger automáticamente

RAZONAMIENTO tRPC (comunicación app móvil ↔ backend):
  ✅ Type-safety end-to-end: TypeScript en server → automáticamente en el cliente
  ✅ Sin generación de código (el tipo ES el contrato)
  ✅ Refactoring seguro: cambiar el servidor rompe el cliente en compile-time
  ✅ Sin over-fetching: el cliente pide exactamente lo que necesita
  ✅ Perfecto para el monolito modular

CUÁNDO USAR GraphQL:
  Solo si en Fase 3 se construye un marketplace B2B con socios externos
  que necesitan queries flexibles. No antes.
```

### 1.3 Relacional vs. NoSQL

```
DECISIÓN: PostgreSQL como base principal + Redis para caché y tiempo real

RAZONAMIENTO:
  PostgreSQL es la decisión correcta para el 95% de este dominio:
  ✅ ACID: un pago, una membresía, un set ejecutado = siempre consistente
  ✅ JSONB: campos dinámicos (configuración de gyms, metadata) sin sacrificar joins
  ✅ Row Level Security: multi-tenant seguro a nivel de base de datos
  ✅ Full-text search: búsqueda en ejercicios y productos sin Elasticsearch
  ✅ pg_vector: embeddings para IA directamente en Postgres (sin servicio extra)
  ✅ Extensiones: uuid-ossp, pg_cron (jobs programados), pg_crypto

  Cuándo añadir otras bases:
  Redis (AHORA):     sesiones, caché, pub/sub para tiempo real, rate limiting
  S3/R2 (AHORA):    archivos, videos, imágenes, documentos
  pg_vector (F2):   embeddings para búsqueda semántica y RAG de ZEUS/ARIA
  ClickHouse (F3):  analytics de series temporales a gran escala (miles de gyms)
```

### 1.4 Hosting & Cloud Provider

```
DECISIÓN: Railway (Fase 1-2) → AWS (Fase 3+)

FASE 1-2 — Railway.app:
  Railway es la plataforma ideal para el MVP y crecimiento inicial:
  ✅ Deploy desde GitHub en minutos (sin configurar servidores)
  ✅ PostgreSQL, Redis incluidos con un clic
  ✅ Escalado automático sin configuración
  ✅ Precio predecible: ~$50-200/mes para los primeros 10-50 gyms
  ✅ Certificados SSL automáticos, dominio personalizado
  ✅ Logs y métricas básicas incluidos
  ✅ El equipo puede enfocarse en el producto, no en infraestructura

FASE 3 — Migración a AWS:
  Cuándo migrar: >100 gyms activos o necesidad de compliance regional específico
  Servicios AWS a usar:
    ECS Fargate (containers sin gestionar servidores)
    RDS Aurora PostgreSQL (managed, multi-AZ, autoscaling)
    ElastiCache Redis (managed)
    S3 + CloudFront (archivos + CDN)
    SES (email transaccional)
    Secrets Manager (variables de entorno seguras)
```

---

## 2. VISTA GENERAL DEL SISTEMA

### 2.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENTES (Interfaces)                               │
│                                                                             │
│  📱 App Móvil         🖥️ Panel Web          🌐 Sitio Público               │
│  (React Native)       (Next.js)             (Next.js Static)               │
│  iOS + Android        Trainer + Admin        Landing + Blog                │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                           │
│              Nginx · Rate Limiting · Request Routing                       │
│              SSL Termination · API Key Validation                          │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                    BACKEND — MONOLITO MODULAR (Node.js)                    │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │   MOD-AUTH  │ │  MOD-MEMBER │ │  MOD-BILLING│ │    MOD-WORKOUT      │  │
│  │   Authn/z   │ │  CRM + ARIA │ │  Pagos/Fact │ │  Builder + ZEUS     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ MOD-MARKET  │ │  MOD-SCHED  │ │  MOD-NUTRI  │ │    MOD-ANALYTICS    │  │
│  │ Marketplace │ │  Agendas    │ │  Nutrición  │ │  BI + Dashboard     │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ MOD-ACCESS  │ │  MOD-NOTIF  │ │  MOD-MEDIA  │ │    MOD-AI           │  │
│  │  Control    │ │  Push/SMS   │ │  Videos/S3  │ │  ARIA + ZEUS + RAG  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    CAPA DE INFRAESTRUCTURA COMPARTIDA                │  │
│  │   Event Bus (interno) · Job Queue · Logger · Config · Tenant Ctx    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                         CAPA DE DATOS                                      │
│                                                                             │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │   PostgreSQL 16   │  │   Redis 7.x       │  │   Cloudflare R2 / S3    │ │
│  │   Base principal  │  │   Caché + PubSub  │  │   Archivos + Videos     │ │
│  │   Multi-tenant    │  │   Sessions + RT   │  │   CDN Global            │ │
│  │   (RLS habilitado)│  │   Rate Limiting   │  │                         │ │
│  └───────────────────┘  └──────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS INTEGRADOS                           │
│                                                                             │
│  Stripe · MercadoPago · WhatsApp API · Twilio · ElevenLabs                 │
│  Anthropic API · OpenAI · Google Vision · Firebase FCM                     │
│  Apple HealthKit · Google Fit · Kisi Access · SendGrid                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de una Petición Típica

```
EJEMPLO: Miembro registra un set ejecutado durante su entreno

1. App móvil (React Native):
   Usuario toca "Serie completada" → 42.5 kg × 11 reps

2. tRPC mutation:
   workoutRouter.logSet({ sessionId, exerciseId, weight: 42.5, reps: 11, rpe: 8 })
   → HTTPS POST a /api/trpc/workout.logSet
   → JWT validado en el middleware de autenticación
   → Tenant ID extraído del JWT → contexto establecido

3. Backend (MOD-WORKOUT):
   WorkoutService.logSet(ctx, input)
   → Validar que la sesión pertenece al miembro del tenant
   → Insertar en executed_sets
   → Calcular si es PR (comparar con personal_records)
   → Si PR: emitir evento interno "PR_ACHIEVED"
   → Actualizar volumen de la sesión en workout_sessions
   → Retornar resultado con flag is_personal_record: true

4. Event Bus interno:
   PR_ACHIEVED event → suscriptores:
   → MOD-GAMIFICATION: sumar puntos, evaluar medallas
   → MOD-NOTIF: encolar notificación push + mensaje ARIA
   → MOD-ANALYTICS: actualizar métricas de trainer

5. Response al cliente:
   { success: true, isPR: true, previousRecord: { weight: 40, reps: 10 } }
   → App muestra animación de PR 🏆
   → Push notification llega: "¡Nuevo récord personal! 42.5 kg × 11 en Press Banca"

Tiempo total: < 200ms
```

---

## 3. STACK TECNOLÓGICO DEFINITIVO

### 3.1 Tabla Completa del Stack

```yaml
BACKEND:
  runtime:          Node.js 22 LTS
  lenguaje:         TypeScript 5.x (strict mode activado)
  framework:        NestJS 11
    justificacion:
      - Arquitectura modular nativa (módulos = nuestros módulos de negocio)
      - Decoradores para DI, guards, interceptors, pipes
      - Soporte nativo para tRPC, REST, WebSockets
      - Ecosystem maduro: testing, CLI, documentación
      - Escalable de monolito a microservicios sin reescribir
  api_interna:      tRPC v11
  api_externa:      REST (OpenAPI 3.1 con Swagger)
  validacion:       Zod 3.x (schemas compartidos frontend-backend)
  orm:              Prisma 6.x
    justificacion:
      - Migrations automáticas con historial
      - Type-safety total en queries
      - Prisma Studio para visualizar la BD en desarrollo
      - Compatible con PostgreSQL, fácil de cambiar si fuera necesario
  job_queue:        BullMQ (sobre Redis)
  websockets:       Socket.io 4.x (para tiempo real en el panel admin)
  testing:          Jest + Supertest (unit + integration)
  linting:          ESLint + Prettier + Husky (pre-commit hooks)

FRONTEND — APP MÓVIL:
  framework:        React Native 0.76 (New Architecture activada)
  lenguaje:         TypeScript 5.x
  navegacion:       Expo Router (file-based routing, como Next.js pero para móvil)
  estado_global:    Zustand (simple, sin boilerplate)
  estado_servidor:  TanStack Query v5 + tRPC client
  ui_components:    React Native Paper + componentes propios del design system
  animaciones:      React Native Reanimated 3
  formularios:      React Hook Form + Zod resolvers
  camara_scanner:   Expo Camera + Expo Barcode Scanner
  audio_voz:        Expo AV + expo-speech
  biometria:        Expo Local Authentication (Face ID, huella)
  notificaciones:   Expo Notifications (wrapper de FCM/APNs)
  offline:          WatermelonDB (SQLite local para workouts offline)
  build:            EAS Build (Expo Application Services)
  testing:          Jest + React Native Testing Library

FRONTEND — PANEL WEB (Admin/Trainer):
  framework:        Next.js 15 (App Router)
  lenguaje:         TypeScript 5.x
  estado_servidor:  TanStack Query + tRPC
  ui_components:    shadcn/ui + Tailwind CSS 4.x
  graficas:         Recharts (dashboards KPIs)
  tablas:           TanStack Table v8
  formularios:      React Hook Form + Zod
  iconos:           Lucide React
  editor_rich_text: Tiptap (para notas de trainer, blog)
  drag_drop:        DnD Kit (para workout builder)
  calendario:       FullCalendar 6 (scheduling de clases y citas)

BASES DE DATOS:
  principal:        PostgreSQL 16
    extensiones:    uuid-ossp, pgcrypto, pg_trgm, pg_vector, pg_cron
  cache_sessions:   Redis 7.x (Stack: Upstash Redis en producción)
  archivos:         Cloudflare R2 (compatible S3, sin egress fees)
  busqueda_vector:  pgvector en PostgreSQL (para RAG de ARIA/ZEUS)

INFRAESTRUCTURA:
  fase_1_2:         Railway.app
  fase_3:           AWS (ECS Fargate + RDS Aurora + ElastiCache)
  cdn:              Cloudflare (DNS, WAF, CDN para assets)
  emails:           Resend (transaccionales) + Loops (marketing)
  monitoreo:        Sentry (errores) + Better Uptime (disponibilidad)
  logs:             Axiom (log management)
  secretos:         Doppler (secrets management multi-ambiente)

IA & ML:
  llm_principal:    Anthropic Claude claude-sonnet-4-20250514 (ARIA + ZEUS)
  llm_fallback:     OpenAI GPT-4o (si Anthropic tiene downtime)
  vision_ia:        Google Cloud Vision API (reconocimiento de productos/fotos)
  tts_voz:          ElevenLabs (voz de ARIA y ZEUS)
  stt_voz:          OpenAI Whisper (voz a texto)
  embeddings:       text-embedding-3-small (OpenAI) → pgvector
  rag_framework:    LangChain.js (gestión de contexto para ARIA/ZEUS)

PAGOS:
  internacional:    Stripe (tarjetas internacionales, Apple Pay, Google Pay)
  latam:            MercadoPago (tarjetas locales, efectivo, wallets)
  facturacion_sv:   Integración DTE El Salvador (proveedor certificado MH)

COMUNICACIONES:
  whatsapp:         Meta Cloud API (WhatsApp Business oficial)
  telegram:         Telegram Bot API
  sms:              Twilio Programmable Messaging
  voz:              Twilio Programmable Voice
  push:             Firebase Cloud Messaging (Android + iOS via APNs)
  email:            Resend (API moderna, excelente deliverability)

ACCESO FÍSICO:
  fase_1:           QR dinámico propio (sin hardware de terceros)
  fase_2:           Kisi API (torniquetes y puertas inteligentes)
  fase_3:           Salto KS / Brivo (enterprise gyms)

HERRAMIENTAS DE DESARROLLO:
  repositorio:      GitHub (monorepo con Turborepo)
  ci_cd:            GitHub Actions
  gestion_proyecto: Linear (issues y sprints)
  documentacion:    Notion + OpenAPI auto-generado
  diseno_ui:        Figma (design system compartido)
  comunicacion:     Slack
```

---

## 4. ARQUITECTURA DEL BACKEND

### 4.1 Estructura de Carpetas (Monorepo)

```
gym-app/                          ← raíz del monorepo (Turborepo)
├── apps/
│   ├── api/                      ← Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts           ← Entry point
│   │   │   ├── app.module.ts     ← Root module
│   │   │   ├── common/           ← Compartido entre módulos
│   │   │   │   ├── auth/         ← Guards, decorators, JWT
│   │   │   │   ├── database/     ← Prisma service, migrations
│   │   │   │   ├── events/       ← Event bus interno
│   │   │   │   ├── exceptions/   ← Manejo global de errores
│   │   │   │   ├── middleware/   ← Tenant context, logging
│   │   │   │   ├── pipes/        ← Zod validation pipes
│   │   │   │   └── utils/        ← Helpers compartidos
│   │   │   │
│   │   │   └── modules/          ← Un módulo por dominio de negocio
│   │   │       ├── auth/         ← Autenticación y sesiones
│   │   │       ├── gyms/         ← Gestión del gym (tenant)
│   │   │       ├── members/      ← CRM, perfiles, retención
│   │   │       ├── memberships/  ← Planes, contratos, ciclo de vida
│   │   │       ├── billing/      ← Pagos, facturas, suscripciones
│   │   │       ├── scheduling/   ← Citas, clases, calendario
│   │   │       ├── workout/      ← Builder, ejercicios, progreso
│   │   │       ├── nutrition/    ← Planes nutricionales, tracking
│   │   │       ├── marketplace/  ← Productos, órdenes, crédito
│   │   │       ├── notifications/← Push, WhatsApp, email, SMS
│   │   │       ├── ai/           ← ARIA, ZEUS, RAG, embeddings
│   │   │       ├── access/       ← Control de acceso físico
│   │   │       ├── gamification/ ← Puntos, medallas, retos
│   │   │       ├── analytics/    ← BI, KPIs, reportes
│   │   │       ├── staff/        ← Trainers, roles, payroll
│   │   │       ├── content/      ← Blog, moderación
│   │   │       └── feedback/     ← Quejas, encuestas, NPS
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma     ← Schema unificado
│   │   │   └── migrations/       ← Historial de migraciones
│   │   └── test/                 ← Tests de integración
│   │
│   ├── web/                      ← Panel Admin/Trainer (Next.js)
│   └── mobile/                   ← App Móvil (React Native + Expo)
│
├── packages/
│   ├── shared-types/             ← Tipos TypeScript compartidos
│   ├── shared-schemas/           ← Schemas Zod compartidos
│   ├── ui-components/            ← Componentes UI compartidos (web)
│   └── mobile-components/        ← Componentes compartidos (mobile)
│
├── turbo.json                    ← Config de Turborepo
├── package.json                  ← Workspace root
└── .env.example                  ← Variables de entorno (plantilla)
```

### 4.2 Estructura de un Módulo (Ejemplo: Billing)

```
modules/billing/
├── billing.module.ts           ← NestJS module definition
├── billing.controller.ts       ← REST endpoints (webhooks de Stripe, etc.)
├── billing.router.ts           ← tRPC router (llamadas desde la app)
├── billing.service.ts          ← Lógica principal del dominio
├── billing.repository.ts       ← Acceso a base de datos (Prisma queries)
├── billing.events.ts           ← Eventos que emite este módulo
├── billing.listeners.ts        ← Eventos de otros módulos que escucha
├── billing.scheduler.ts        ← Jobs programados (cobros recurrentes)
├── billing.types.ts            ← Tipos e interfaces del módulo
├── billing.constants.ts        ← Constantes del módulo
│
├── stripe/                     ← Sub-módulo de Stripe
│   ├── stripe.service.ts
│   └── stripe-webhook.handler.ts
│
├── mercadopago/                ← Sub-módulo de MercadoPago
│   ├── mercadopago.service.ts
│   └── mp-webhook.handler.ts
│
├── invoices/                   ← Sub-módulo de facturas
│   ├── invoice.service.ts
│   ├── invoice-pdf.generator.ts
│   └── dte-sv.service.ts      ← Facturación electrónica El Salvador
│
└── __tests__/
    ├── billing.service.spec.ts
    └── billing.integration.spec.ts
```

### 4.3 Bus de Eventos Interno

```typescript
// El Event Bus desacopla los módulos — clave para el monolito modular

// Definición de eventos tipados (packages/shared-types/events.ts)
export enum GymEvent {
  // Membresías
  MEMBERSHIP_ACTIVATED = 'membership.activated',
  MEMBERSHIP_EXPIRED = 'membership.expired',
  MEMBERSHIP_FROZEN = 'membership.frozen',

  // Pagos
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Entrenamiento
  SESSION_COMPLETED = 'workout.session_completed',
  PERSONAL_RECORD = 'workout.personal_record',
  PLAN_ASSIGNED = 'workout.plan_assigned',

  // Acceso
  MEMBER_CHECKED_IN = 'access.member_checked_in',
  ACCESS_DENIED = 'access.denied',

  // CRM
  RISK_SCORE_CRITICAL = 'crm.risk_score_critical',
  MEMBER_INACTIVE = 'crm.member_inactive',

  // Gamificación
  POINTS_EARNED = 'gamification.points_earned',
  BADGE_UNLOCKED = 'gamification.badge_unlocked',
}

// Ejemplo: Módulo de Workout emite un evento
// modules/workout/workout.service.ts
@Injectable()
export class WorkoutService {
  constructor(private eventBus: EventBus) {}

  async completeSession(sessionId: string) {
    // ... lógica de completar sesión

    // Emitir evento — sin saber quién lo escucha
    await this.eventBus.emit(GymEvent.SESSION_COMPLETED, {
      memberId,
      sessionId,
      volumeKg: totalVolume,
      duration: durationMinutes,
      prsAchieved: personalRecords,
    });
  }
}

// Módulo de Gamificación escucha el evento
// modules/gamification/gamification.listeners.ts
@Injectable()
export class GamificationListeners {
  @OnEvent(GymEvent.SESSION_COMPLETED)
  async handleSessionCompleted(payload: SessionCompletedPayload) {
    await this.gamificationService.awardSessionPoints(payload.memberId);
  }

  @OnEvent(GymEvent.PERSONAL_RECORD)
  async handlePersonalRecord(payload: PRPayload) {
    await this.gamificationService.awardPRBadge(payload.memberId, payload.exercise);
  }
}
```

### 4.4 Middleware de Contexto Multi-Tenant

```typescript
// Cada request lleva el gym_id en el JWT
// Este middleware lo extrae y lo pone disponible en todo el request

// common/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = this.jwtService.decode(token) as JwtPayload;
      req['tenantId'] = decoded.gymId;
      req['userId'] = decoded.sub;
      req['userRole'] = decoded.role;
    }
    next();
  }
}

// Uso en cualquier servicio:
@Injectable()
export class MemberService {
  async getMembers(@CurrentTenant() gymId: string) {
    // Prisma automáticamente filtra por gymId gracias a RLS
    return this.prisma.member.findMany({
      where: { gymId }, // SIEMPRE incluir — nunca olvidar
    });
  }
}
```

---

## 5. ARQUITECTURA MULTI-TENANT

### 5.1 Estrategia de Multi-Tenancy

```
DECISIÓN: Shared Database, Shared Schema con Row-Level Security (RLS)

OPCIÓN A — Base de datos separada por gym:
  ✅ Máximo aislamiento
  ❌ Costoso (un RDS por gym)
  ❌ Migraciones complejas (actualizar 100 bases de datos)
  ❌ Reporting cross-gym imposible
  → Descartada para Fase 1-2

OPCIÓN B — Schema separado por gym (mismo servidor):
  ✅ Buen aislamiento
  ❌ Máximo 100-200 schemas en Postgres antes de degradar
  ❌ Migraciones aún complejas
  → Descartada

OPCIÓN C — Tabla compartida con gym_id + RLS: ✅ ELEGIDA
  ✅ Un solo schema, migraciones simples
  ✅ PostgreSQL Row Level Security garantiza aislamiento a nivel de BD
  ✅ Queries de reporting cross-gym cuando el SaaS lo necesite
  ✅ Escala a miles de gyms sin cambios de arquitectura
  ✅ Costo mínimo
```

### 5.2 Implementación de Row Level Security

```sql
-- Activar RLS en todas las tablas con datos de tenant

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
-- ... (todas las tablas)

-- Política: cada query solo ve datos del gym_id del usuario autenticado
CREATE POLICY tenant_isolation ON members
  USING (gym_id = current_setting('app.current_gym_id')::uuid);

-- En la aplicación, al iniciar cada transacción:
-- prisma.$executeRaw`SET app.current_gym_id = ${gymId}`

-- Política especial para super-admin (puede ver todo):
CREATE POLICY super_admin_all ON members
  USING (
    current_setting('app.current_role') = 'super_admin'
    OR gym_id = current_setting('app.current_gym_id')::uuid
  );
```

### 5.3 Modelo de Datos de Tenants

```sql
-- La tabla gyms ES el tenant root
CREATE TABLE gyms (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identidad
  name                  VARCHAR(200) NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL, -- para URLs: gym-elite.app/gyms/el-titan
  legal_name            VARCHAR(200),
  tax_id                VARCHAR(50),                  -- NIT El Salvador
  -- Contacto
  email                 VARCHAR(150),
  phone                 VARCHAR(20),
  website               VARCHAR(200),
  address               JSONB,
  -- Config
  timezone              VARCHAR(50) DEFAULT 'America/El_Salvador',
  currency              VARCHAR(3) DEFAULT 'USD',
  locale                VARCHAR(10) DEFAULT 'es-SV',
  -- Branding (white-label)
  logo_url              TEXT,
  primary_color         VARCHAR(7),                   -- #hex
  secondary_color       VARCHAR(7),
  app_name              VARCHAR(100),                 -- nombre de su app
  -- Plan SaaS del gym
  saas_plan             VARCHAR(20) DEFAULT 'starter',-- starter|pro|elite|enterprise
  saas_status           VARCHAR(20) DEFAULT 'trial',  -- trial|active|suspended|cancelled
  trial_ends_at         TIMESTAMP,
  saas_billing_day      INTEGER DEFAULT 1,
  -- Features habilitados (por plan)
  features              JSONB DEFAULT '{}',           -- {ai_aria: true, multi_location: false}
  -- Onboarding
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  onboarding_step       INTEGER DEFAULT 1,
  -- Multi-sede
  parent_gym_id         UUID REFERENCES gyms(id),    -- si es una sede de una cadena
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Configuraciones específicas del gym (extensible sin cambiar schema)
CREATE TABLE gym_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL UNIQUE REFERENCES gyms(id),
  -- Operación
  operating_hours       JSONB,         -- {monday: {open: "06:00", close: "22:00"}, ...}
  max_capacity          INTEGER,
  checkin_method        TEXT[],        -- ['qr', 'rfid', 'face']
  -- Membresías
  grace_period_days     INTEGER DEFAULT 3,
  freeze_policy         JSONB,
  cancellation_policy   JSONB,
  -- Billing
  default_payment_terms INTEGER DEFAULT 30,
  late_fee_amount       DECIMAL(10,2) DEFAULT 0,
  -- Notificaciones
  notification_config   JSONB,
  -- Integraciones activas
  integrations          JSONB,         -- {stripe_key_id, mp_access_token, whatsapp_number}
  -- ARIA y ZEUS
  aria_name             VARCHAR(50) DEFAULT 'ARIA',
  zeus_name             VARCHAR(50) DEFAULT 'ZEUS',
  aria_voice_id         VARCHAR(100),  -- ElevenLabs voice ID
  zeus_voice_id         VARCHAR(100),
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

---

## 6. ARQUITECTURA DE LA APP MÓVIL

### 6.1 Estructura de Carpetas (Expo Router)

```
apps/mobile/
├── app/                          ← Rutas (file-based routing)
│   ├── (auth)/                   ← Layout group — sin tab bar
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   ├── (member)/                 ← Layout group — miembro activo
│   │   ├── _layout.tsx           ← Tab bar del miembro
│   │   ├── index.tsx             ← Home / Dashboard
│   │   ├── workout/
│   │   │   ├── index.tsx         ← Mi entrenamiento
│   │   │   ├── session.tsx       ← Sesión activa (tiempo real)
│   │   │   ├── progress.tsx      ← Mi progreso
│   │   │   └── exercise/[id].tsx ← Detalle de ejercicio
│   │   ├── schedule/
│   │   │   ├── index.tsx         ← Mis citas y reservas
│   │   │   └── book.tsx          ← Agendar nueva cita
│   │   ├── nutrition/
│   │   │   ├── index.tsx         ← Mi plan nutricional
│   │   │   ├── log.tsx           ← Registrar comida
│   │   │   └── photo.tsx         ← Foto del plato
│   │   ├── store/
│   │   │   ├── index.tsx         ← Marketplace home
│   │   │   ├── product/[id].tsx  ← Detalle de producto
│   │   │   └── cart.tsx          ← Carrito
│   │   ├── community/
│   │   │   ├── index.tsx         ← Feed social
│   │   │   └── challenges.tsx    ← Retos
│   │   └── profile/
│   │       ├── index.tsx         ← Mi perfil
│   │       ├── membership.tsx    ← Mi membresía
│   │       └── settings.tsx      ← Configuración
│   │
│   ├── (staff)/                  ← Layout group — trainers
│   │   ├── _layout.tsx
│   │   ├── index.tsx             ← Dashboard del trainer
│   │   ├── clients/
│   │   │   ├── index.tsx
│   │   │   └── [memberId]/
│   │   │       ├── index.tsx     ← Perfil del cliente
│   │   │       └── plan.tsx      ← Gestionar plan
│   │   └── builder/
│   │       └── index.tsx         ← Workout Builder simplificado
│   │
│   └── +not-found.tsx
│
├── components/
│   ├── ui/                       ← Componentes base del design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── workout/                  ← Componentes específicos de workout
│   │   ├── ExerciseCard.tsx
│   │   ├── SetLogger.tsx         ← El componente más crítico
│   │   ├── MuscleMap.tsx
│   │   ├── ProgressChart.tsx
│   │   └── TimerDisplay.tsx
│   ├── nutrition/
│   ├── marketplace/
│   └── shared/
│
├── hooks/                        ← Custom hooks
│   ├── useWorkoutSession.ts      ← Estado de la sesión activa
│   ├── useOfflineSync.ts         ← Sincronización offline
│   ├── useZeus.ts                ← Hook para interactuar con ZEUS
│   └── useCamera.ts              ← Cámara y escáner
│
├── stores/                       ← Zustand stores
│   ├── authStore.ts              ← Usuario autenticado
│   ├── workoutStore.ts           ← Estado de la sesión de entreno
│   ├── cartStore.ts              ← Carrito del marketplace
│   └── notificationStore.ts
│
├── lib/
│   ├── trpc.ts                   ← tRPC client config
│   ├── queryClient.ts            ← TanStack Query config
│   ├── storage.ts                ← WatermelonDB para offline
│   └── analytics.ts             ← Tracking de eventos
│
└── constants/
    ├── colors.ts                 ← Paleta de colores del design system
    ├── fonts.ts
    └── config.ts
```

### 6.2 Estrategia Offline-First

```typescript
// La app debe funcionar sin conexión durante el entreno
// WatermelonDB (SQLite local) almacena el estado del entreno

// El miembro puede:
// ✅ Ver su plan de entrenamiento (descargado)
// ✅ Ver los videos de ejercicios (descargados en WiFi)
// ✅ Registrar sets (guardados localmente)
// ✅ Ver su historial de las últimas 30 sesiones
// ❌ Agendar citas (requiere conexión)
// ❌ Hacer compras (requiere conexión)

// hooks/useOfflineSync.ts
export function useOfflineSync() {
  const syncToServer = async () => {
    const pendingSets = await localDB.sets.where('synced').equals(0).fetch();

    if (pendingSets.length > 0 && isOnline) {
      await trpc.workout.syncSets.mutate({ sets: pendingSets });
      await localDB.sets.markAsSynced(pendingSets.map((s) => s.id));
    }
  };

  // Sync automático cuando vuelve la conexión
  useNetworkListener(syncToServer);
}
```

### 6.3 Design System & Tema Visual

```typescript
// constants/colors.ts
// El gym puede personalizar estos colores desde su panel
// La app los descarga al iniciar sesión

export const defaultTheme = {
  // Primarios
  primary: '#1A3C5E', // Azul marino profundo
  secondary: '#0F7B6C', // Verde teal
  accent: '#E8A020', // Ámbar dorado

  // Estados
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Fondos
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',

  // Texto
  textPrimary: '#1C2B3A',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',

  // Bordes
  border: '#E2E8F0',
  borderFocus: '#1A3C5E',
};

// Tipografía
export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    bold: 'Inter_700Bold',
    display: 'Poppins_700Bold', // Para títulos grandes
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};
```

---

## 7. ARQUITECTURA DEL PANEL WEB (ADMIN)

### 7.1 Estructura del Panel

```
apps/web/
├── app/                          ← Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx
│   │
│   ├── (dashboard)/              ← Layout con sidebar
│   │   ├── layout.tsx            ← Sidebar + Header
│   │   ├── page.tsx              ← Dashboard ejecutivo
│   │   │
│   │   ├── members/
│   │   │   ├── page.tsx          ← Lista de miembros
│   │   │   └── [id]/page.tsx     ← Perfil 360° del miembro
│   │   │
│   │   ├── classes/
│   │   │   ├── page.tsx          ← Calendario de clases
│   │   │   └── schedule/page.tsx ← Gestión de horarios
│   │   │
│   │   ├── billing/
│   │   │   ├── page.tsx          ← Dashboard financiero
│   │   │   ├── invoices/page.tsx
│   │   │   └── credit/page.tsx   ← Cartera de crédito
│   │   │
│   │   ├── workout/
│   │   │   ├── builder/page.tsx  ← Workout Builder (principal)
│   │   │   └── library/page.tsx  ← Biblioteca de ejercicios
│   │   │
│   │   ├── marketplace/
│   │   │   ├── products/page.tsx ← Catálogo
│   │   │   └── orders/page.tsx   ← Órdenes
│   │   │
│   │   ├── staff/page.tsx
│   │   ├── analytics/page.tsx    ← BI completo
│   │   ├── feedback/page.tsx     ← Quejas y encuestas
│   │   ├── content/page.tsx      ← Blog moderación
│   │   └── settings/
│   │       ├── gym/page.tsx      ← Config del gym
│   │       ├── integrations/page.tsx
│   │       └── billing/page.tsx  ← Plan SaaS
│   │
│   └── api/                      ← API routes de Next.js
│       └── webhooks/             ← Stripe, WhatsApp, etc.
│
├── components/
│   ├── dashboard/                ← KPI cards, charts
│   ├── builder/                  ← Workout Builder DnD
│   ├── calendar/                 ← Scheduling calendar
│   ├── tables/                   ← Data tables
│   └── forms/                    ← Form components
│
└── lib/
    ├── trpc.ts
    └── server-utils.ts
```

---

## 8. BASE DE DATOS — DISEÑO UNIFICADO

### 8.1 Convenciones del Schema

```sql
-- CONVENCIONES OBLIGATORIAS para todas las tablas:

-- 1. Siempre UUID como primary key
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- 2. SIEMPRE gym_id en tablas de tenant (excepto gyms, roles, ejercicios del sistema)
gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE

-- 3. Timestamps en TODAS las tablas
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL

-- 4. Soft delete en tablas críticas (nunca borrar, solo ocultar)
deleted_at TIMESTAMP WITH TIME ZONE  -- null = activo

-- 5. Trigger automático para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language plpgsql;
-- Aplicar a cada tabla: CREATE TRIGGER update_[table]_updated_at...

-- 6. Índices estándar obligatorios
CREATE INDEX idx_[table]_gym_id ON [table](gym_id);
CREATE INDEX idx_[table]_created_at ON [table](created_at DESC);
```

### 8.2 Diagrama de Relaciones Entre Módulos

```
CORE (gyms, users, roles)
        │
        ├── MEMBERS (members, member_profiles, contacts)
        │       │
        │       ├── MEMBERSHIPS (memberships, membership_types, contracts, freezes)
        │       │       │
        │       │       └── BILLING (subscriptions, transactions, invoices, payment_methods)
        │       │
        │       ├── SCHEDULING (appointments, services, classes, class_bookings)
        │       │
        │       ├── WORKOUT (training_plans, training_days, workout_sessions, executed_sets)
        │       │       │
        │       │       └── EXERCISES (exercises, exercise_library, personal_records)
        │       │
        │       ├── NUTRITION (nutrition_plans, meal_logs, food_diary)
        │       │
        │       ├── MARKETPLACE (marketplace_orders, credit_accounts, wallets)
        │       │       │
        │       │       └── PRODUCTS (products, variants, inventory)
        │       │
        │       ├── GAMIFICATION (loyalty_points, badges, challenges, leaderboards)
        │       │
        │       └── CRM (interaction_log, risk_scores, workflows, segments)
        │
        ├── STAFF (staff_profiles, trainer_certifications, schedules, payroll)
        │
        ├── ACCESS (access_logs, access_devices, qr_tokens)
        │
        ├── ANALYTICS (metric_snapshots, kpi_history, reports)
        │
        └── CONTENT (blog_posts, feedback_tickets, surveys)
```

### 8.3 Estrategia de Migraciones

```yaml
Herramienta: Prisma Migrate
Entornos: development | staging | production

Proceso: 1. Cambio en prisma/schema.prisma
  2. npx prisma migrate dev --name "add_subscription_pause_feature"
  → Genera archivo SQL en prisma/migrations/
  → Aplica en base de datos local
  3. Code review del archivo SQL generado (OBLIGATORIO)
  4. Merge a main → GitHub Actions aplica automáticamente en staging
  5. Aprobación manual para producción (si hay cambios destructivos)

Reglas de migraciones: ✅ Agregar columnas nullable (no rompe nada)
  ✅ Agregar nuevas tablas (no rompe nada)
  ✅ Agregar índices (puede ser lento — usar CONCURRENTLY en producción)
  ⚠️  Renombrar columnas → crear nueva + copiar datos + deprecar antigua
  ❌  DROP TABLE/COLUMN en producción → soft delete primero, drop después de 1 mes
  ❌  Cambiar tipo de columna → siempre a través de migración explícita
```

---

## 9. SISTEMA DE AUTENTICACIÓN & AUTORIZACIÓN

### 9.1 Flujo de Autenticación

```
REGISTRO / LOGIN:

1. Usuario envía credenciales (email + password)
2. Backend valida y genera 2 tokens:
   - Access Token (JWT):  expira en 15 minutos
   - Refresh Token:       expira en 30 días, almacenado en HttpOnly cookie

3. Access Token payload:
   {
     sub: "user-uuid",
     gymId: "gym-uuid",
     role: "member" | "trainer" | "admin" | "super_admin",
     membershipStatus: "active" | "expired" | "frozen",
     iat: timestamp,
     exp: timestamp
   }

4. App móvil almacena Access Token en Secure Storage (Expo SecureStore)
5. En cada request: Authorization: Bearer <access_token>

6. Cuando el Access Token expira:
   - App detecta 401 response
   - Silenciosamente llama a /auth/refresh con el Refresh Token (cookie)
   - Recibe nuevo Access Token
   - Reintenta el request original (transparente para el usuario)

7. Logout: invalidar Refresh Token en base de datos (tabla: refresh_tokens)

SEGURIDAD ADICIONAL:
  - Rate limiting en /auth/login: 5 intentos por minuto por IP
  - Account lockout: 10 intentos fallidos → bloqueo 15 minutos
  - 2FA opcional (TOTP vía Google Authenticator / SMS)
  - Detección de login desde nuevo dispositivo → notificación email
```

### 9.2 Sistema de Roles y Permisos (RBAC)

```typescript
// Roles del sistema
export enum Role {
  SUPER_ADMIN = 'super_admin', // Dueño de la plataforma SaaS
  GYM_OWNER = 'gym_owner', // Dueño del gym
  GYM_ADMIN = 'gym_admin', // Administrador del gym
  TRAINER = 'trainer', // Trainer/instructor
  RECEPTIONIST = 'receptionist', // Recepcionista
  NUTRITIONIST = 'nutritionist', // Nutricionista
  MEMBER = 'member', // Miembro activo
  MEMBER_TRIAL = 'member_trial', // Miembro en periodo de prueba
}

// Permisos granulares por recurso y acción
export const Permissions = {
  // Miembros
  MEMBER_READ: 'member:read',
  MEMBER_WRITE: 'member:write',
  MEMBER_DELETE: 'member:delete',
  MEMBER_FINANCIALS: 'member:financials', // ver info financiera
  MEMBER_MEDICAL: 'member:medical', // ver historial médico

  // Membresías
  MEMBERSHIP_READ: 'membership:read',
  MEMBERSHIP_MANAGE: 'membership:manage', // crear, modificar
  MEMBERSHIP_CANCEL: 'membership:cancel',
  MEMBERSHIP_REFUND: 'membership:refund',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_PROCESS: 'billing:process',
  BILLING_REFUND: 'billing:refund',
  BILLING_DISCOUNT: 'billing:discount',
  BILLING_MAX_DISCOUNT: 'billing:max_discount', // % máximo configurable

  // Workout
  WORKOUT_VIEW_OWN: 'workout:view_own',
  WORKOUT_VIEW_ALL: 'workout:view_all',
  WORKOUT_BUILD: 'workout:build',
  WORKOUT_ASSIGN: 'workout:assign',
  EXERCISE_MANAGE: 'exercise:manage',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_FULL: 'analytics:full', // incluyendo financiero

  // Staff
  STAFF_READ: 'staff:read',
  STAFF_MANAGE: 'staff:manage',
  STAFF_PAYROLL: 'staff:payroll',

  // Sistema
  GYM_SETTINGS: 'gym:settings',
  GYM_INTEGRATIONS: 'gym:integrations',
  GYM_BILLING: 'gym:billing', // plan SaaS
} as const;

// Mapa de roles → permisos
export const RolePermissions: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: ['*'], // todos los permisos
  [Role.GYM_OWNER]: Object.values(Permissions),
  [Role.GYM_ADMIN]: [
    Permissions.MEMBER_READ,
    Permissions.MEMBER_WRITE,
    Permissions.MEMBERSHIP_MANAGE,
    Permissions.MEMBERSHIP_CANCEL,
    Permissions.BILLING_READ,
    Permissions.BILLING_PROCESS,
    Permissions.BILLING_DISCOUNT,
    Permissions.WORKOUT_VIEW_ALL,
    Permissions.WORKOUT_BUILD,
    Permissions.ANALYTICS_VIEW,
    Permissions.ANALYTICS_EXPORT,
    Permissions.STAFF_READ,
    Permissions.GYM_SETTINGS,
  ],
  [Role.TRAINER]: [
    Permissions.MEMBER_READ,
    Permissions.WORKOUT_VIEW_ALL,
    Permissions.WORKOUT_BUILD,
    Permissions.WORKOUT_ASSIGN,
  ],
  [Role.RECEPTIONIST]: [
    Permissions.MEMBER_READ,
    Permissions.MEMBERSHIP_READ,
    Permissions.BILLING_PROCESS,
    Permissions.BILLING_DISCOUNT, // con límite %
  ],
  [Role.NUTRITIONIST]: [Permissions.MEMBER_READ, Permissions.MEMBER_MEDICAL],
  [Role.MEMBER]: [Permissions.WORKOUT_VIEW_OWN],
  [Role.MEMBER_TRIAL]: [Permissions.WORKOUT_VIEW_OWN],
};
```

---

## 10. SISTEMA DE NOTIFICACIONES UNIFICADO

### 10.1 Arquitectura del Sistema

```
NOTIFICATION ENGINE

FUENTES (qué genera notificaciones):
  - Event Bus interno (PR, sesión completada, pago)
  - Schedulers (recordatorios de citas, vencimiento de membresía)
  - ARIA (mensajes de retención, motivacionales)
  - Staff (mensajes manuales a miembros)
  - Sistema (alertas de seguridad, actualizaciones)

PROCESAMIENTO (cómo se decide qué enviar):
  1. Evento llega al Notification Service
  2. Verificar preferencias del usuario (¿opt-in a este tipo?)
  3. Verificar horario preferido (no enviar a las 3am)
  4. Seleccionar canal preferido (WhatsApp > Push > Email)
  5. Generar contenido personalizado (con contexto del usuario)
  6. Encolar en BullMQ con prioridad

CANALES (cómo se entrega):
  Push Notifications:    Firebase Cloud Messaging → iOS (APNs) + Android
  WhatsApp:              Meta Cloud API → mensajes de texto/audio/botones
  Telegram:              Bot API
  Email:                 Resend → templates HTML personalizados
  SMS:                   Twilio → para cuando no hay internet
  In-App:                Socket.io → badge en tiempo real sin notificación

PRIORIDADES DE COLA:
  CRITICAL (inmediato):  acceso denegado, pago fallido, alerta médica
  HIGH (< 1 min):        PR nuevo, sesión completada, cita confirmada
  NORMAL (< 5 min):      recordatorios, motivacionales, marketing
  LOW (< 1 hora):        newsletters, sugerencias, analytics
```

### 10.2 Schema de Notificaciones

```sql
CREATE TABLE notification_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID REFERENCES gyms(id),  -- null = template del sistema
  event_type      VARCHAR(100) NOT NULL,
  channel         VARCHAR(20) NOT NULL,      -- push|whatsapp|email|sms|in_app
  name            VARCHAR(100) NOT NULL,
  subject         VARCHAR(200),              -- para email
  body_template   TEXT NOT NULL,             -- Handlebars template
  variables       JSONB,                     -- variables disponibles en el template
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id          UUID NOT NULL REFERENCES gyms(id),
  member_id       UUID REFERENCES members(id),
  event_type      VARCHAR(100),
  channel         VARCHAR(20) NOT NULL,
  status          VARCHAR(20) DEFAULT 'queued',
  -- queued|sending|delivered|failed|read
  provider_id     VARCHAR(200),              -- ID del mensaje en WhatsApp/FCM/etc.
  content         TEXT,
  error_message   TEXT,
  retry_count     INTEGER DEFAULT 0,
  scheduled_at    TIMESTAMP,
  sent_at         TIMESTAMP,
  delivered_at    TIMESTAMP,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 11. INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL

### 11.1 Arquitectura de IA del Sistema

```
CAPA DE IA — ARQUITECTURA RAG (Retrieval-Augmented Generation)

┌─────────────────────────────────────────────────────────────────┐
│                        ORQUESTADOR DE IA                        │
│                    (AIService — NestJS Module)                  │
├────────────────────┬────────────────────┬───────────────────────┤
│     ARIA Engine    │    ZEUS Engine     │   AI Tasks Engine     │
│  (Asistente CRM)  │  (Coach Técnico)   │  (Background AI Jobs) │
└────────┬───────────┴─────────┬──────────┴──────────┬────────────┘
         │                     │                     │
┌────────▼─────────────────────▼─────────────────────▼────────────┐
│                    CONTEXT BUILDER                               │
│  Construye el contexto específico del miembro para cada query   │
│  member profile + history + plan + preferences + restrictions   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    RETRIEVAL LAYER (RAG)                         │
│                                                                  │
│  pgvector (PostgreSQL):                                          │
│  - Ejercicios vectorizados para búsqueda semántica              │
│  - Base de conocimiento científico del gym                      │
│  - FAQ del gym (para ARIA)                                       │
│  - Historial de conversaciones relevantes                        │
│                                                                  │
│  Búsqueda híbrida: semántica (embeddings) + keywords (pg_trgm)  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    LLM LAYER                                     │
│  Primary: Anthropic claude-sonnet-4-20250514 (Claude Sonnet 4.6)│
│  Fallback: OpenAI GPT-4o                                         │
│  Framework: LangChain.js                                         │
│  Streaming: SSE para respuestas largas en tiempo real            │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Sistema de Prompts

```typescript
// Arquitectura de prompts — System prompts por agente

// lib/ai/prompts/aria.system.ts
export const ARIA_SYSTEM_PROMPT = `
Eres ARIA, la asistente virtual del gimnasio {gymName}.
Tu especialidad es la relación con los miembros: motivación, 
seguimiento, agendamiento y soporte.

PERSONALIDAD:
- Cálida, empática, motivacional y profesional
- Siempre usas el nombre del miembro
- Nunca usas lenguaje de culpa ni presión agresiva
- Siempre conectas el mensaje con el objetivo del miembro

CONTEXTO DEL MIEMBRO:
{memberContext}

REGLAS CRÍTICAS:
1. NUNCA diagnósticos médicos
2. NUNCA comprometerte con cosas fuera de tu alcance
3. Si detectas frustración alta → escalar al staff: [ESCALATE]
4. Si el miembro menciona cancelación → activar retención suave
5. Responder SIEMPRE en {language}

CAPACIDADES:
- Agendar y gestionar citas (llamar tools disponibles)
- Consultar disponibilidad de clases
- Informar sobre membresía y pagos del miembro
- Responder preguntas sobre el gym
- Enviar mensajes motivacionales contextualizados
`;

// lib/ai/prompts/zeus.system.ts
export const ZEUS_SYSTEM_PROMPT = `
Eres ZEUS, el coach virtual de entrenamiento del gimnasio {gymName}.
Tu especialidad es la ciencia del ejercicio, técnica de movimiento
y programación del entrenamiento.

PLAN DE ENTRENAMIENTO ACTIVO:
{workoutPlan}

HISTORIAL RECIENTE:
{recentSessions}

RESTRICCIONES MÉDICAS:
{medicalRestrictions}

PRINCIPIOS:
1. Seguridad primero — ante dolor agudo: detener y referir a médico
2. Basarte en evidencia científica actualizada
3. Empoderar al miembro, no crear dependencia
4. No contradecir las instrucciones específicas del trainer asignado

CAPACIDADES:
- Explicar técnica de cualquier ejercicio
- Sugerir alternativas cuando la máquina está ocupada
- Analizar el progreso y dar feedback
- Responder preguntas de fisiología del ejercicio
- Guiar la sesión por voz si está activado
`;
```

### 11.3 Gestión de Costos de IA

```yaml
Estimación de costos por gym (100 miembros activos):

  ARIA (mensajes de retención y soporte):
    Mensajes promedio/día: ~50 conversaciones
    Tokens promedio/conversación: ~800 (input) + 300 (output)
    Costo estimado/mes: ~$15-25 USD

  ZEUS (coaching durante sesiones):
    Consultas promedio/día: ~30 (no todos los miembros usan ZEUS)
    Tokens promedio/consulta: ~1200 (input) + 400 (output)
    Costo estimado/mes: ~$20-35 USD

  Background AI (generación de planes, análisis de fotos):
    Corridas promedio/día: ~10
    Costo estimado/mes: ~$10-20 USD

  TOTAL IA por gym/mes: ~$45-80 USD

  Incluido en el precio SaaS: sí (en planes Pro y Elite)
  Límite de tokens configurable para evitar abuso

OPTIMIZACIONES DE COSTO:
  - Caché de respuestas comunes (preguntas FAQ repetidas)
  - Contexto reducido para queries simples (no enviar el historial completo)
  - Modelo más barato para tareas simples (Haiku para clasificación simple)
  - Rate limiting por miembro: máx. 20 consultas a ZEUS por sesión
```

---

## 12. INFRAESTRUCTURA CLOUD & DEVOPS

### 12.1 Ambientes

```yaml
Ambientes del sistema:
  DEVELOPMENT (local):
    Backend: localhost:3001
    Web: localhost:3000
    Mobile: Expo Go o simulador
    Database: PostgreSQL local (Docker)
    Redis: Redis local (Docker)
    Payments: Stripe Test Mode
    AI: Claude API (mismo que producción, con límite)

  STAGING (Railway):
    URL: api.staging.gymapp.io
    Branch: develop
    Deploy: automático en cada push
    Database: Railway PostgreSQL (instancia separada)
    Propósito: QA, demos a clientes, testing de integraciones
    Datos: seed con datos de prueba, NO datos reales

  PRODUCTION (Railway → AWS):
    URL: api.gymapp.io
    Branch: main
    Deploy: manual con aprobación (GitHub Environment protection)
    Database: Railway PostgreSQL Pro (backups automáticos diarios)
    Uptime: 99.9% SLA objetivo
    Monitoring: Sentry + Better Uptime + Axiom logs
```

### 12.2 CI/CD Pipeline

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout código
      - Setup Node.js 22
      - Install dependencies (npm ci)
      - Run type check (tsc --noEmit)
      - Run linter (eslint)
      - Run unit tests (jest)
      - Run integration tests (con PostgreSQL en Docker)
      - Upload coverage report

  build:
    needs: test
    steps:
      - Build backend (tsc)
      - Build web (next build)
      - Run Prisma validate
      - Build Docker image

  deploy-staging:
    needs: build
    if: branch == 'develop'
    steps:
      - Deploy to Railway staging
      - Run Prisma migrate deploy
      - Run smoke tests
      - Notify Slack: 'Staging actualizado'

  deploy-production:
    needs: build
    if: branch == 'main'
    environment: production # requiere aprobación manual
    steps:
      - Deploy to Railway production
      - Run Prisma migrate deploy (con confirmación)
      - Run health checks
      - Notify Slack: 'Producción actualizada ✅'
```

### 12.3 Variables de Entorno

```bash
# .env.example — Plantilla completa (NUNCA commitear .env real)

# ─── APLICACIÓN ───────────────────────────────────────────────────
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
WEB_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:8081

# ─── BASE DE DATOS ────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/gymapp_dev
DIRECT_URL=postgresql://user:pass@localhost:5432/gymapp_dev  # para Prisma Migrate
REDIS_URL=redis://localhost:6379

# ─── AUTENTICACIÓN ────────────────────────────────────────────────
JWT_SECRET=change-this-to-long-random-string-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
ENCRYPTION_KEY=32-char-random-key-for-field-encryption

# ─── PAGOS ────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=...

# ─── COMUNICACIONES ───────────────────────────────────────────────
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...  # para validar webhook
TELEGRAM_BOT_TOKEN=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...

# ─── INTELIGENCIA ARTIFICIAL ──────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # fallback + embeddings + Whisper
ELEVENLABS_API_KEY=...
GOOGLE_VISION_API_KEY=...

# ─── ALMACENAMIENTO ───────────────────────────────────────────────
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=gymapp-media
CDN_BASE_URL=https://media.gymapp.io

# ─── FIREBASE ─────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# ─── ACCESO FÍSICO ────────────────────────────────────────────────
KISI_API_KEY=...

# ─── MONITOREO ────────────────────────────────────────────────────
SENTRY_DSN=https://...@sentry.io/...
AXIOM_TOKEN=...
AXIOM_DATASET=gymapp-logs

# ─── FACTURACIÓN EL SALVADOR ──────────────────────────────────────
DTE_PROVIDER_URL=https://...
DTE_PROVIDER_API_KEY=...
DTE_NIT_EMISOR=...
```

---

## 13. SEGURIDAD & CUMPLIMIENTO

### 13.1 Mapa de Amenazas y Mitigaciones

```yaml
AMENAZA: Inyección SQL
  MITIGACIÓN: Prisma ORM — nunca SQL crudo, queries parametrizados
  EXTRA: pg_stat_activity monitoring para queries inusuales

AMENAZA: XSS (Cross-Site Scripting)
  MITIGACIÓN: React escapa automáticamente; CSP headers configurados
  EXTRA: DOMPurify para contenido del blog

AMENAZA: CSRF
  MITIGACIÓN: SameSite=Strict en cookies; Origin header validation

AMENAZA: Autenticación débil
  MITIGACIÓN: bcrypt (cost 12) para passwords; rate limiting en login
  EXTRA: 2FA disponible; detección de IP inusual

AMENAZA: Exposición de datos sensibles
  MITIGACIÓN: Encriptación AES-256 para campos médicos y financieros
  EXTRA: Logs no contienen datos PII; responses filtran campos sensibles

AMENAZA: Acceso no autorizado entre tenants
  MITIGACIÓN: RLS en PostgreSQL; gym_id en TODOS los queries
  EXTRA: Tests de penetración cross-tenant en el CI

AMENAZA: API abusada (scraping, DDoS)
  MITIGACIÓN: Rate limiting por IP y por usuario con Redis
  EXTRA: Cloudflare WAF; suspicious traffic alerting

AMENAZA: Datos de tarjetas robados
  MITIGACIÓN: Stripe/MP son los únicos que ven datos de tarjeta
              El sistema NUNCA almacena datos de tarjeta en bruto
  CERTIFICACIÓN: PCI-DSS SAQ A compliance

AMENAZA: Vulnerabilidades en dependencias
  MITIGACIÓN: Dependabot automático (GitHub); npm audit en CI
  EXTRA: Solo dependencias con mantenimiento activo

AMENAZA: Fuga de secrets
  MITIGACIÓN: Doppler para secrets management; nunca en código
  EXTRA: GitGuardian scanning en el repositorio

AMENAZA: Pérdida de datos
  MITIGACIÓN: Backups automáticos diarios de PostgreSQL (Railway)
              Retención de backups: 30 días
  EXTRA: Test de restauración mensual
```

### 13.2 Política de Retención de Datos (GDPR / Ley Local)

```yaml
Datos de miembros activos: Mientras la membresía esté activa
Datos post-cancelación: 2 años (para win-back y análisis)
Datos financieros/facturas: 7 años (requerimiento fiscal El Salvador)
Logs de acceso físico: 6 meses
Logs de conversaciones con ARIA: 1 año
Grabaciones de voz: 90 días (con consentimiento)
Fotos de progreso: Mientras el miembro las tenga activas
Datos médicos: 5 años post-cancelación

Derecho al olvido (GDPR):
  Proceso: miembro solicita eliminación desde la app o por email
  SLA: eliminación completa en máx. 30 días
  Excepción: datos financieros/fiscales que la ley requiere conservar
  Implementación:
    - Eliminar datos PII (nombre, email, teléfono → "Usuario Eliminado")
    - Conservar registros financieros con ID anonimizado
    - Eliminar fotos, notas personales, historial médico
    - Exportación de datos disponible antes de eliminar
```

---

## 14. APIS & INTEGRACIONES EXTERNAS

### 14.1 Webhooks Críticos (Eventos entrantes)

```typescript
// Stripe Webhook Handler
@Post('/webhooks/stripe')
@UseGuards(StripeWebhookGuard)  // valida la firma de Stripe
async handleStripeWebhook(@Body() event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.billingService.handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await this.billingService.handlePaymentFailure(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await this.membershipService.handleSubscriptionCancelled(event.data.object);
      break;
    case 'invoice.payment_failed':
      await this.billingService.startDunningProcess(event.data.object);
      break;
  }
  return { received: true };
}

// WhatsApp Webhook Handler
@Post('/webhooks/whatsapp')
async handleWhatsAppWebhook(@Body() body: WhatsAppWebhookBody) {
  const messages = body.entry[0].changes[0].value.messages;
  for (const message of messages) {
    await this.ariaService.processIncomingMessage({
      from:     message.from,  // número de teléfono
      type:     message.type,  // text|audio|image|button
      content:  message.text?.body || message.audio?.id,
      timestamp: message.timestamp,
    });
  }
}
```

### 14.2 Rate Limiting por API Externa

```typescript
// Protección contra costos inesperados por abuso

const apiLimits = {
  anthropic_per_member_per_day: 50, // consultas a ZEUS/ARIA
  elevenlabs_per_member_per_day: 20, // generación de voz
  google_vision_per_member_per_day: 10, // análisis de fotos
  whatsapp_per_member_per_day: 30, // mensajes salientes
};

// Si se supera el límite:
// → Respuesta degradada (texto en lugar de voz)
// → Notificación al admin del gym
// → El miembro ve un mensaje amigable: "ZEUS está muy ocupado hoy,
//   intenta de nuevo en unos minutos"
```

---

## 15. ESTRATEGIA DE ESCALABILIDAD

### 15.1 Escalabilidad Horizontal

```yaml
Fase 1 (1-50 gyms, hasta 5,000 miembros totales):
  Infrastructure: Railway (1 instancia del backend)
  Database: 1 instancia PostgreSQL (Railway managed)
  Redis: 1 instancia Redis (Upstash serverless)
  Costo estimado: $50-150/mes
  Acción requerida: ninguna

Fase 2 (50-200 gyms, hasta 20,000 miembros):
  Infrastructure: Railway (2-3 instancias backend con load balancer)
  Database: PostgreSQL con read replica para queries de analytics
  Redis: Upstash Redis con mayor memoria
  CDN: Cloudflare para assets y videos
  Costo estimado: $300-800/mes
  Acción requerida: añadir read replica, separar jobs en worker process

Fase 3 (200+ gyms, 100,000+ miembros):
  Infrastructure: AWS ECS Fargate (auto-scaling)
  Database: RDS Aurora PostgreSQL (multi-AZ, auto-scaling)
  Cache: ElastiCache Redis Cluster
  Jobs: SQS + Lambda para procesos asincrónicos
  CDN: CloudFront + S3
  Costo estimado: $2,000-8,000/mes
  Acción requerida: migración completa a AWS + extraer módulos IA y billing
```

### 15.2 Optimización de Performance

```yaml
Estrategias implementadas desde el inicio:
  BASE DE DATOS:
    - Índices en todas las foreign keys y campos de búsqueda frecuente
    - Query explain-analyze en desarrollo para queries lentas
    - Paginación con cursor (no offset) para listas grandes
    - Eager loading con Prisma include (evitar N+1 queries)
    - Vistas materializadas para dashboards complejos (actualizadas cada hora)

  CACHE (Redis):
    - Dashboard KPIs: cache de 5 minutos (no necesita ser tiempo real exacto)
    - Catálogo de ejercicios: cache de 1 hora (cambia poco)
    - Perfil del miembro: cache de 1 minuto (invalidado al actualizar)
    - Disponibilidad de clases: sin cache (tiempo real)

  APP MÓVIL:
    - TanStack Query: cache local con stale-while-revalidate
    - Imágenes: Expo Image con cache automático
    - Listas largas: FlashList (mejor rendimiento que FlatList)
    - Videos: pre-carga en background en WiFi
    - Skeleton loaders siempre (nunca pantallas en blanco)

  API:
    - Compression middleware (gzip)
    - Response con ETag para recursos estáticos
    - Streaming para respuestas de IA (SSE)
    - Batch requests para operaciones múltiples
```

---

## 16. PLAN DE IMPLEMENTACIÓN POR FASES

### 16.1 Roadmap de Desarrollo

```
FASE 0 — PREPARACIÓN (2 semanas):
  □ Configurar monorepo (Turborepo)
  □ Setup de Railway (staging + production)
  □ Configurar GitHub Actions (CI/CD básico)
  □ Setup de Doppler (secrets management)
  □ Crear schema inicial de Prisma (tablas core)
  □ Setup design system base (colores, tipografía)
  □ Configurar Sentry + Axiom (monitoreo)
  □ Crear datos de seed para desarrollo

FASE 1 — MVP CORE (12-16 semanas):
  Semanas 1-4: Fundamentos
    □ Autenticación completa (registro, login, 2FA, refresh tokens)
    □ Multi-tenancy (gyms, gym_settings, RLS)
    □ Sistema de roles y permisos
    □ Panel admin básico (scaffold con shadcn/ui)
    □ App móvil: autenticación + navegación base

  Semanas 5-8: Membresías & Billing
    □ CRUD completo de membresías
    □ Tipos de membresía configurables
    □ Integración Stripe (cobros, webhooks, reintentos)
    □ Integración MercadoPago
    □ Generación de facturas PDF
    □ Portal del miembro en la app

  Semanas 9-12: Workout & Check-in
    □ Biblioteca de ejercicios (CRUD + fotos + videos)
    □ Workout Builder básico (plan + días + ejercicios)
    □ Ejecución de sesión en la app (registro de sets)
    □ QR de acceso + check-in
    □ Dashboard básico del trainer

  Semanas 13-16: Comunicaciones & Notificaciones
    □ Push notifications (FCM)
    □ Integración WhatsApp Business API
    □ Email transaccional (Resend)
    □ ARIA básico (respuestas simples sin RAG)
    □ Recordatorios automáticos de citas

FASE 2 — DIFERENCIACIÓN (16-20 semanas):
  □ ZEUS Coach Virtual (con RAG completo)
  □ ARIA avanzado (retención, workflows, voz)
  □ Sistema de citas completo + calendario
  □ Módulo nutricional (plan + tracking)
  □ Marketplace (catálogo + carrito + crédito + pagos)
  □ Gamificación (puntos + medallas + leaderboards)
  □ Dashboard ejecutivo completo (KPIs + reportes)
  □ App móvil: foto de plato (AI Vision) + pedido por voz

FASE 3 — ESCALA & INNOVACIÓN (20+ semanas):
  □ Integración wearables (Apple Health, Garmin)
  □ Control de acceso IoT (Kisi)
  □ Blog + portal comunitario
  □ Multi-sede completo
  □ BI avanzado + Business Coach IA
  □ API pública para integraciones externas
  □ Migración infraestructura a AWS
```

---

## 17. ESTÁNDARES DE CÓDIGO & CONVENCIONES

### 17.1 Convenciones Obligatorias

```typescript
// NOMBRADO:
// - Archivos: kebab-case (user-service.ts, member-profile.tsx)
// - Clases/Interfaces/Types: PascalCase (MemberService, IPaymentResult)
// - Variables/funciones: camelCase (getUserById, isPaymentSuccessful)
// - Constantes: SCREAMING_SNAKE_CASE (MAX_RETRY_COUNT, DEFAULT_PAGE_SIZE)
// - Base de datos: snake_case (created_at, gym_id, member_profile)

// ESTRUCTURA DE ARCHIVOS DE SERVICIO:
@Injectable()
export class ExampleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  // 1. Public methods first (API del servicio)
  async findById(gymId: string, id: string): Promise<Member> { ... }
  async create(gymId: string, dto: CreateMemberDto): Promise<Member> { ... }
  async update(gymId: string, id: string, dto: UpdateMemberDto): Promise<Member> { ... }

  // 2. Private helpers (implementación interna)
  private async validateEmail(email: string): Promise<void> { ... }
  private async sendWelcomeNotification(member: Member): Promise<void> { ... }
}

// MANEJO DE ERRORES:
// - NUNCA throw sin capturar
// - Usar excepciones tipadas de NestJS
// - Log antes de lanzar
// - Mensajes de error en español para el usuario, inglés en los logs

throw new NotFoundException(`Miembro ${id} no encontrado en el gym ${gymId}`);
throw new BadRequestException('El email ya está registrado en este gimnasio');
throw new ForbiddenException('No tienes permisos para ver los datos financieros');

// ASYNC/AWAIT:
// - Siempre usar async/await (no .then().catch())
// - Siempre try/catch en operaciones externas (pagos, APIs, DB)
// - Nunca Promise.all sin manejo de error individual

// TIPOS:
// - Nunca 'any' — si es necesario, usar 'unknown' y castear con validación
// - DTOs con class-validator + Zod para toda entrada de usuario
// - Return types explícitos en funciones públicas
```

### 17.2 Reglas de Pull Request

```yaml
Checklist de PR obligatorio: □ El PR no tiene más de 400 líneas de cambio (si más → dividir)
  □ Todos los tests pasan en CI
  □ No hay warnings de TypeScript (strict mode)
  □ Nuevos endpoints documentados en Swagger
  □ Migración de BD probada (up Y down)
  □ Variables de entorno nuevas agregadas a .env.example
  □ No hay secrets ni datos reales en el código
  □ Self-review completo antes de pedir review

Review obligatorio por: □ 1 desarrollador senior (para PRs de cualquier tamaño)
  □ 2 desarrolladores (para cambios en billing, auth, o schema de BD)

Branches:
  main: producción — solo merge via PR aprobado
  develop: staging — integración continua
  feature/: features nuevas (desde develop)
  fix/: bugfixes (desde develop o main si es hotfix)
  chore/: mantenimiento, dependencias, docs
```

---

## 18. GLOSARIO TÉCNICO

```yaml
Términos del proyecto:
  Tenant: Un gimnasio en la plataforma (cliente del SaaS)
  Gym ID: UUID único que identifica al tenant en toda la base de datos
  RLS: Row Level Security — seguridad a nivel de fila en PostgreSQL
  tRPC: Protocolo de llamadas tipadas entre cliente y servidor (TypeScript RPC)
  RAG: Retrieval-Augmented Generation — IA que busca contexto antes de responder
  LLM: Large Language Model — modelo de IA generativa (Claude, GPT)
  Embedding: Vector numérico que representa el significado semántico de un texto
  pgvector: Extensión de PostgreSQL para almacenar y buscar embeddings
  BullMQ: Sistema de colas de trabajo asíncrono basado en Redis
  Event Bus: Sistema de publicación/suscripción de eventos interno del monolito
  Soft Delete: Marcar un registro como eliminado sin borrarlo físicamente
  Dunning: Proceso automatizado de recuperación de pagos fallidos
  ARPU: Average Revenue Per User — ingreso promedio por usuario
  MRR: Monthly Recurring Revenue — ingresos recurrentes mensuales
  Churn: Tasa de cancelación de membresías
  LTV: Lifetime Value — valor total que genera un miembro durante su vida útil
  Risk Score: Puntuación (0-100) que predice la probabilidad de cancelación
  Webhook: HTTP callback — el proveedor externo nos notifica de eventos
  CDN: Content Delivery Network — red de distribución de archivos
  PWA: Progressive Web App — app web con capacidades nativas
  SSE: Server-Sent Events — streaming de respuestas del servidor
  JWT: JSON Web Token — token de autenticación
  RBAC: Role-Based Access Control — control de acceso por roles
  PCI-DSS: Estándar de seguridad para procesamiento de pagos con tarjeta
  DTE: Documento Tributario Electrónico — facturación electrónica El Salvador
  HRV: Heart Rate Variability — variabilidad de frecuencia cardíaca (wearables)
  1RM: One Rep Maximum — peso máximo en una repetición
  RPE: Rate of Perceived Exertion — escala de esfuerzo percibido (1-10)
  RIR: Reps In Reserve — repeticiones que quedan en el tanque
  DUP: Daily Undulating Periodization — periodización ondulante diaria
  EMOM: Every Minute On the Minute — protocolo de entrenamiento por intervalos
  AMRAP: As Many Rounds As Possible — protocolo de entrenamiento por tiempo
```

---

## 📎 APÉNDICE — DECISIONES PENDIENTES

Estas decisiones requieren input del equipo antes de iniciar la fase correspondiente:

```yaml
PENDIENTE ANTES DE FASE 1:
  □ Decidir: ¿App en una sola tienda (Expo EAS) o dos tiendas separadas (iOS/Android)?
    Recomendación: Expo EAS para empezar (un solo codebase, más rápido)

  □ Decidir: ¿Dominio principal de la plataforma SaaS?
    Ejemplo: gymapp.io / fitapp.io / migimnasio.app

  □ Confirmar: ¿Facturación electrónica DTE desde el inicio o en Fase 2?
    Recomendación: Fase 1 solo facturas PDF simples, DTE en Fase 2

  □ Confirmar: ¿Nombre definitivo de ARIA y ZEUS?
    (personalizable por gym, pero se necesita el default del sistema)

PENDIENTE ANTES DE FASE 2:
  □ Decidir: ¿Proveedor de DTE en El Salvador?
    Opciones: Factura.sv, DTE-SV, otros proveedores certificados MH

  □ Decidir: ¿Voz de ARIA y ZEUS en ElevenLabs?
    Requiere: grabar muestras de voz o seleccionar voces del catálogo

  □ Confirmar: ¿Integración con qué sistema de acceso físico como primera prioridad?
    Recomendación: Kisi (mejor API, precio razonable)

PENDIENTE ANTES DE FASE 3:
  □ Decidir: ¿Estrategia de expansión LATAM?
    ¿México primero, o Colombia, o Guatemala como mercados similares a El Salvador?

  □ Decidir: ¿Modelo de pricing del SaaS?
    (Ver documento de Go-to-Market cuando esté disponible)
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Tipo: Documento Técnico — CONFIDENCIAL_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión: Al iniciar Fase 2_  
_Maintainer: CTO / Arquitecto Principal_
