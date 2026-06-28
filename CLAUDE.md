# GymApp — Contexto de Proyecto para Claude Code

> **Plataforma SaaS multi-tenant de gestión integral de gimnasios de élite.**
> Monorepo: NestJS API + Next.js Web Admin + React Native/Expo Mobile.

---

## 1. VISIÓN Y ALCANCE

GymApp es una plataforma SaaS B2B2C en LATAM (foco inicial El Salvador) que permite a los gimnasios gestionar todos sus procesos —membresías, facturación, control de acceso, entrenamientos, nutrición, marketplace, CRM, gamificación y analítica— desde un solo sistema multi-tenant.

**Dos interfaces:**

- **Web Admin** (`apps/web`): módulo administrativo para dueños, admins, trainers, recepcionistas
- **Mobile App** (`apps/mobile`): app nativa para miembros (iOS + Android)

**Modelo de negocio:** SaaS por suscripción mensual al gym (B2B) + comisiones marketplace (B2C opcional)

---

## 2. ESTRUCTURA DEL MONOREPO

```
C:\Sistemas\GymApp\
├── apps/
│   ├── api/               ← NestJS 11 — backend REST + tRPC + WebSocket
│   ├── web/               ← Next.js 15 — panel admin
│   └── mobile/            ← React Native 0.76 + Expo Router — app miembro
├── packages/
│   ├── shared-types/      ← tipos TypeScript compartidos (Zod schemas)
│   ├── shared-schemas/    ← schemas Zod compilados para validación
│   ├── ui-components/     ← shadcn/ui + Tailwind para web
│   └── mobile-components/ ← componentes React Native compartidos
├── docs/
│   ├── adr/               ← Architecture Decision Records
│   └── PLAN_TRABAJO.md    ← Plan de trabajo detallado por fases
├── CLAUDE.md              ← este archivo
├── turbo.json
└── package.json
```

---

## 3. STACK TECNOLÓGICO COMPLETO

### Backend (`apps/api`)

| Categoría     | Tecnología          | Versión |
| ------------- | ------------------- | ------- |
| Runtime       | Node.js LTS         | 22.x    |
| Lenguaje      | TypeScript          | 5.x     |
| Framework     | NestJS              | 11.x    |
| API interna   | tRPC                | v11     |
| Validación    | Zod                 | 3.x     |
| ORM           | Prisma              | 6.x     |
| Jobs/Queue    | BullMQ              | latest  |
| WebSocket     | Socket.io           | 4.x     |
| Base de datos | PostgreSQL          | 16      |
| Cache         | Redis 7.x (Upstash) | —       |
| Storage       | Cloudflare R2       | —       |
| Secrets       | Doppler             | —       |

### Web Admin (`apps/web`)

| Categoría       | Tecnología              |
| --------------- | ----------------------- |
| Framework       | Next.js 15 (App Router) |
| Componentes     | shadcn/ui + Radix UI    |
| Estilos         | Tailwind CSS 4.x        |
| Gráficas        | Recharts                |
| Tablas          | TanStack Table v8       |
| Calendario      | FullCalendar 6          |
| Drag & Drop     | DnD Kit                 |
| Rich Text       | Tiptap                  |
| Estado servidor | TanStack Query v5       |
| Estado cliente  | Zustand                 |

### Mobile (`apps/mobile`)

| Categoría       | Tecnología                      |
| --------------- | ------------------------------- |
| Framework       | React Native 0.76 + Expo SDK 52 |
| Navegación      | Expo Router                     |
| Estado servidor | TanStack Query v5               |
| Estado cliente  | Zustand                         |
| Animaciones     | React Native Reanimated 3       |
| Offline DB      | WatermelonDB (SQLite)           |
| Notificaciones  | Firebase FCM                    |

### PostgreSQL Extensions requeridas

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- búsqueda difusa
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector para embeddings IA
CREATE EXTENSION IF NOT EXISTS "pg_cron";       -- jobs dentro de Postgres
```

### Infraestructura por fase

- **Fase 1–2 (MVP–Growth):** Railway.app — simple, auto-deploy, ~$50–300/mes
- **Fase 3+ (Scale):** AWS ECS Fargate + RDS + ElastiCache — $2,000–8,000/mes
- **CDN/WAF:** Cloudflare (todas las fases)

### IA y Servicios Externos

| Servicio                | Uso                                   | Modelo/Plan                         |
| ----------------------- | ------------------------------------- | ----------------------------------- |
| Anthropic               | ARIA, ZEUS, Business Coach            | claude-sonnet-4-20250514 (primario) |
| OpenAI                  | Fallback LLM + Vision foto productos  | GPT-4o                              |
| ElevenLabs              | TTS para ARIA y ZEUS (voz)            | —                                   |
| OpenAI Whisper          | STT — comandos de voz en ZEUS         | —                                   |
| Google Vision API       | Reconocimiento de producto por foto   | —                                   |
| Google Natural Language | Análisis de sentimiento interacciones | —                                   |
| LangChain.js            | RAG pipeline para ARIA/ZEUS           | —                                   |
| pgvector                | Almacén de embeddings RAG             | —                                   |

### Pagos y Facturación

| Servicio          | Alcance                                 |
| ----------------- | --------------------------------------- |
| Stripe            | Internacional, PCI-DSS L1               |
| MercadoPago       | LATAM (El Salvador, Guatemala, etc.)    |
| DTE El Salvador   | CCF, CF, NC — Ministerio de Hacienda    |
| QuickBooks / Xero | Integración contable (webhooks o batch) |

### Comunicaciones

| Canal             | Servicio               |
| ----------------- | ---------------------- |
| WhatsApp Business | Meta API (flujos ARIA) |
| Telegram          | Bot API                |
| SMS + Voice       | Twilio                 |
| Push móvil        | Firebase FCM           |
| Email             | SendGrid / Resend      |

### Control de Acceso Físico

| Fase        | Tecnología                                |
| ----------- | ----------------------------------------- |
| MVP (P1)    | QR dinámico propio (HMAC-SHA256, 60s TTL) |
| Growth (P2) | Kisi API + NFC MIFARE DESFire EV3         |
| Scale (P3)  | Salto KS / Brivo / HID enterprise         |

### Monitoreo y Observabilidad

- **Errores:** Sentry
- **Uptime:** Better Uptime
- **Logs:** Axiom

---

## 4. MÓDULOS DE NEGOCIO

### Tabla de módulos

| Código              | Nombre                            | Fase                    |
| ------------------- | --------------------------------- | ----------------------- |
| `GYM-MOD-AUTH`      | Autenticación & RBAC              | MVP P1                  |
| `GYM-MOD-GYMS`      | Configuración del Gym             | MVP P1                  |
| `GYM-MOD-MEM`       | Membresías                        | MVP P1                  |
| `GYM-MOD-BIL`       | Billing & Pagos                   | MVP P1                  |
| `GYM-MOD-ACCESS`    | Control de Acceso & Seguridad     | MVP P1 (QR) → P2 (IoT)  |
| `GYM-MOD-WKT`       | Workout Builder & Progreso (ZEUS) | MVP P1 core → P2 IA     |
| `GYM-MOD-CRM-V`     | CRM + ARIA Virtual + Citas        | MVP P1 CRM → P2 full    |
| `GYM-MOD-ANALYTICS` | Panel Ejecutivo & BI              | MVP P1 básico → P2 full |
| `GYM-MOD-STAFF`     | Gestión de Staff                  | MVP P1                  |
| `GYM-MOD-NOTIF`     | Notificaciones multi-canal        | MVP P1                  |
| `GYM-MOD-NUTRI`     | Nutrición AI                      | P2                      |
| `GYM-MOD-MKT`       | Marketplace Integral              | P2                      |
| `GYM-MOD-GAME`      | Gamificación & Comunidad          | P2                      |
| `GYM-MOD-CONTENT`   | Blog & Contenido                  | P2                      |
| `GYM-MOD-SCHED`     | Clases & Horarios                 | P2                      |
| `GYM-MOD-FEEDBACK`  | Feedback & NPS                    | P2                      |
| `GYM-MOD-LEADS`     | Pipeline de Leads                 | P2                      |

---

## 5. ARQUITECTURA TÉCNICA

### Multi-Tenancy

- **Estrategia:** Shared Database + Shared Schema + PostgreSQL Row Level Security (RLS)
- Cada tabla con datos de gym tiene columna `gym_id UUID NOT NULL`
- RLS activado en TODAS las tablas de negocio
- `TenantMiddleware` inyecta `gym_id` en contexto Nest en CADA request
- Nunca acceder a datos sin pasar por el context de tenant

```typescript
// Patrón obligatorio en todos los servicios
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const gymId = req.headers['x-gym-id'] || extractFromJWT(req);
    req['gymId'] = gymId;
    next();
  }
}
```

### Arquitectura General (Fase 1–2)

- **Modular Monolith** — un solo proceso NestJS con módulos independientes
- Comunicación interna: Event Bus pub/sub con enum `GymEvent`
- Comunicación externa: REST (endpoints públicos) + tRPC (web admin)
- WebSocket: Socket.io para notificaciones real-time y sesiones de workout

### Event Bus Interno

```typescript
enum GymEvent {
  MEMBER_CHECKED_IN = 'member.checked_in',
  MEMBERSHIP_ACTIVATED = 'membership.activated',
  MEMBERSHIP_EXPIRED = 'membership.expired',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PR_ACHIEVED = 'workout.pr_achieved',
  RISK_SCORE_HIGH = 'crm.risk_score_high',
  POINTS_EARNED = 'gamification.points_earned',
  BADGE_UNLOCKED = 'gamification.badge_unlocked',
}
```

### Auth Strategy

- JWT access token (15min TTL) + Refresh token (30 días, rotación)
- 2FA obligatorio para roles `GYM_OWNER`, `GYM_ADMIN`, roles con acceso financiero
- Sessions con fingerprint (IP + User-Agent hash)
- Blacklist de tokens revocados en Redis

### Business Intelligence

- DB transaccional → `metric_snapshots` diarios (pg_cron)
- Vista materializada `dashboard_kpis` — refresh CONCURRENTLY cada hora
- Cache Redis TTL 30s para endpoints del dashboard ejecutivo

---

## 6. ROLES Y PERMISOS (RBAC)

| Rol            | Alcance                                             |
| -------------- | --------------------------------------------------- |
| `SUPER_ADMIN`  | Acceso total a todos los gyms (operador SaaS)       |
| `GYM_OWNER`    | Todo dentro de su gym, incluye billing propio       |
| `GYM_ADMIN`    | Operaciones del gym, sin billing/config avanzada    |
| `TRAINER`      | Ver/gestionar sus alumnos y planes de entrenamiento |
| `RECEPTIONIST` | Check-in, membresías, cobros básicos                |
| `NUTRITIONIST` | Planes nutricionales y registros alimenticios       |
| `MEMBER`       | App móvil — perfil propio, workout, marketplace     |
| `MEMBER_TRIAL` | Igual que MEMBER con acceso limitado durante trial  |

---

## 7. PLANES SAAS (Suscripción del Gym)

### 7.1 Planes y precios (USD, mensual)

| Plan         | Precio mensual | Pago anual (-20%) | Miembros    | Sedes      | Staff      | IA                     |
| ------------ | -------------- | ----------------- | ----------- | ---------- | ---------- | ---------------------- |
| `starter`    | **$79**        | $63/mes           | Hasta 150   | 1          | 5          | ARIA básica            |
| `pro`        | **$149**       | $119/mes          | Hasta 500   | 1          | 15         | ARIA + ZEUS completo   |
| `elite`      | **$299**       | $239/mes          | Hasta 1,500 | 3          | 50         | + Business Coach IA    |
| `enterprise` | desde **$500** | cotización        | Sin límite  | Sin límite | Sin límite | Todo + personalización |

Cada módulo verifica el plan del gym antes de exponer funcionalidades.

### 7.2 Plan Fundadores (primeros 50 gyms, oferta única)

Precios congelados de por vida, no suben aunque cambien los regulares:

| Plan Fundador    | Precio congelado | vs. regular |
| ---------------- | ---------------- | ----------- |
| Starter Fundador | $59/mes          | -25%        |
| Pro Fundador     | $99/mes          | -33%        |
| Elite Fundador   | $199/mes         | -33%        |

Beneficios adicionales: 3 meses gratis al contratar, onboarding personalizado, migración de datos gratuita, badge "Fundador" permanente, participación en el "Consejo de Fundadores" con voto en el roadmap. Plazo: hasta completar los 50 cupos o 90 días desde el lanzamiento.

### 7.3 Add-ons (opcionales, se suman al plan base)

| Add-on                                                     | Precio                    | Aplica a                          |
| ---------------------------------------------------------- | ------------------------- | --------------------------------- |
| Sede adicional                                             | +$79/mes                  | Pro                               |
| White-Label App (App Store / Play Store con marca del gym) | +$99/mes                  | Pro, Elite                        |
| Reconocimiento facial extra (por punto de acceso)          | +$49/mes                  | Elite incluye 2 puntos            |
| SMS Premium (sobre los 500 incluidos)                      | $40 por pack de 1,000 SMS | Todos                             |
| Almacenamiento extra (videos, fotos)                       | +$10/mes por 100GB        | Pro: 50GB / Elite: 200GB incluido |
| Integración contable personalizada (QuickBooks/Xero/XML)   | +$29/mes                  | Todos                             |
| Módulo Bienestar Corporativo                               | +$99/mes                  | Pro+                              |
| Migración de datos (Excel, Mindbody, Glofox, etc.)         | $299 pago único           | Todos                             |

### 7.4 Programa de Partners (revendedores y referrers)

| Tipo              | Comisión / Descuento                                | Requisito            |
| ----------------- | --------------------------------------------------- | -------------------- |
| Referral Partner  | 20% del primer año del cliente referido             | —                    |
| Reseller Partner  | 30% descuento sobre lista (margen libre al cliente) | 3 clientes activos   |
| Strategic Partner | 40% descuento + co-marketing + roadmap acceso       | 10+ clientes activos |

Mercados target para partners: consultores de gym, distribuidores de equipamiento, contadores de gyms, asociaciones de gym por país.

### 7.5 Health Score B2B (de cada gym cliente, distinto del Risk Score del miembro)

Score 0-100 calculado a partir de señales de uso del producto:

**Suma puntos:** miembros activos (30), uso de billing (20), ARIA enviando mensajes (15), staff logeándose (10), dashboard visitado por el dueño esta semana (10), miembros en la app móvil >40% (10), NPS >7 (5).

**Resta puntos:** sin logins en 7 días (-20), ningún cobro este mes (-30), tickets soporte >48h (-10), solo 1 usuario activo (-15), NPS <5 (-20).

| Rango  | Color    | Acción del Customer Success                          |
| ------ | -------- | ---------------------------------------------------- |
| 80-100 | Verde    | Check-in mensual                                     |
| 60-79  | Amarillo | Llamada esta semana + oferta de capacitación         |
| 40-59  | Naranja  | Intervención inmediata + sesión de rescate           |
| 0-39   | Rojo     | Escalada al liderazgo + oferta especial de retención |

Métricas objetivo: B2B churn mensual <2%, NPS de gyms >50, trial-to-paid >45%, tiempo hasta primer "AHA moment" <24h.

Detalle completo en `Diseño/Ver2/Estrategia_Comercial_GoToMarket.md`.

---

## 8. AGENTES IA

### ARIA — Asistente Relacional Inteligente

- **Módulo:** `GYM-MOD-CRM-V`
- **Rol:** CRM conversacional, retención, citas, ventas marketplace
- **Nombre configurable por gym** (white-label)
- **Canales:** WhatsApp, Telegram, app móvil, web chat
- **LLM:** Claude claude-sonnet-4-20250514 primario / GPT-4o fallback
- **RAG:** pgvector + LangChain.js con 4 capas de conocimiento
- **Rate limit:** 50 queries/miembro/día
- **TTS:** ElevenLabs (respuestas de voz)
- **STT:** OpenAI Whisper

**Contexto ARIA incluye:**

```javascript
// Patrón de contexto para cada interacción
const ariaContext = {
  member: { name, goal, riskScore, daysSinceLastVisit, loyaltyLevel },
  gym: { name, staff, policies },
  conversation: { history, channel, preferredTime },
};
```

### ZEUS — Zone·Expert·Universal·Support

- **Módulo:** `GYM-MOD-WKT`
- **Rol:** Coach de workout en tiempo real durante la sesión
- **Activación por voz:** "Hey ZEUS"
- **Comandos de voz:** pausar/reanudar, siguiente ejercicio, sustituir, consultar músculo trabajado
- **Base de conocimiento (4 capas):**
  1. Datos del miembro (plan, PRs, lesiones, wearables HRV/sueño)
  2. Biblioteca del gym (ejercicios, notas del trainer)
  3. Investigación científica (ACSM, NSCA, ACE, EXRX)
  4. Conocimiento general LLM

### Business Coach IA

- **Módulo:** `GYM-MOD-ANALYTICS`
- **Rol:** Consultas en lenguaje natural al panel ejecutivo
- **LLM:** Claude claude-sonnet-4-20250514 (misma config que ARIA)

---

## 9. REGLAS DE NEGOCIO CRÍTICAS

### Ciclo de Vida del Miembro

```
LEAD → TRIAL → ACTIVE ↔ FREEZE ↔ EXPIRED ↔ PRE_CANCEL → CANCELLED
                  ↑___________________↑ (reactivación posible)
```

### Risk Score (Puntuación de Riesgo de Churn)

Score 0–100, recalculado cada 6 horas via `pg_cron`. **12 señales:**
| Señal | Peso |
|-------|------|
| Frecuencia de visitas | 25% |
| Ausencias sin justificar | 15% |
| Cambio en horario de visitas | 10% |
| Engagement con la app | 10% |
| Respuesta a ARIA | 10% |
| Historial de pagos | 10% |
| Progreso físico (logros) | 8% |
| NPS / feedback | 7% |
| Quejas abiertas | 5% |
| Cancelaciones de citas | 5% |
| Tiempo en membresía | 3% |
| Historial de freezes | 2% |

- Score > 70 → Alerta al trainer + activación WF-005 (retención L2)
- Score > 85 → Alerta urgente + WF-006 (retención crítica)

### Dunning (Reintentos de Pago Fallido)

- Día 0: fallo → notificación + 1er reintento
- Día 3: 2do reintento
- Día 5: 3er reintento
- Día 7: bloqueo de acceso + notificación urgente
- Día 14: inicio proceso de cancelación automática

### Gamificación — Niveles

| Nivel   | Rango (FitCoins lifetime) | Nombre configurable |
| ------- | ------------------------- | ------------------- |
| Bronce  | 0 – 999                   | —                   |
| Plata   | 1,000 – 4,999             | —                   |
| Oro     | 5,000 – 14,999            | —                   |
| Platino | 15,000 – 29,999           | —                   |
| Élite   | 30,000+                   | —                   |

El nombre de la moneda ("FitCoins") es configurable por gym.

### Workflows de Retención Automáticos

| ID     | Nombre            | Trigger                   |
| ------ | ----------------- | ------------------------- |
| WF-001 | Onboarding        | Alta de miembro nuevo     |
| WF-002 | Cumpleaños        | Fecha cumpleaños          |
| WF-003 | Logro Alcanzado   | Goal completado           |
| WF-004 | Retención L1      | 3–7 días inactivo         |
| WF-005 | Retención L2      | 7–14 días inactivo        |
| WF-006 | Retención Crítica | 14+ días / pre-cancel     |
| WF-007 | Win-Back          | Post-cancelación          |
| WF-008 | Renovación Anual  | 30 días antes vencimiento |

---

## 10. CONTROL DE ACCESO FÍSICO

### Fases de Implementación

1. **P1 (MVP):** QR dinámico — payload `{memberId, gymId, timestamp, expiresAt, signature, nonce}`, HMAC-SHA256, 60 segundos de vigencia
2. **P2 (Growth):** Kisi API + NFC MIFARE DESFire EV3 (AES-128) + BLE (rotating keys 15min)
3. **P3 (Scale):** Salto KS / Brivo / HID / Facial Recognition (InsightFace, 512-dim pgvector)

### Edge Computing (Fase 2+)

- Hardware: Raspberry Pi 4 o controlador industrial IoT
- Decisión offline < 100ms
- Sincronización cada 30 segundos
- Cache máximo 2 horas sin conexión
- Protocolo: MQTT (controlador ↔ backend)

### Facial Recognition — RESTRICCIONES CRÍTICAS

```
⚠️  PROCESAMIENTO LOCAL ÚNICAMENTE — NUNCA CLOUD
⚠️  Los embeddings (512-dim float32) solo se almacenan en pgvector del gym
⚠️  Cumplimiento GDPR Artículo 9 (datos biométricos = categoría especial)
⚠️  Auto-eliminación de embeddings al cancelar membresía
⚠️  NUNCA usar datos biométricos para entrenar modelos de IA
```

---

## 11. MÓDULO DE MEMBRESÍAS Y BILLING

### Catálogo de Planes Ejemplo

| Plan           | Precio | Frecuencia |
| -------------- | ------ | ---------- |
| Day Pass       | $10    | una vez    |
| Mensual Básico | $40    | mensual    |
| Mensual Pro    | $65    | mensual    |
| Trimestral     | $175   | trimestral |
| Semestral      | $300   | semestral  |
| Anual          | $500   | anual      |
| Anual Elite    | $650   | anual      |

### Facturación DTE El Salvador

- Tipos: `CF` (Consumidor Final), `CCF` (Crédito Fiscal), `NC` (Nota de Crédito)
- Transmisión al Ministerio de Hacienda vía proveedor autorizado
- Campos requeridos: `dte_codigo_generacion`, `dte_numero_control`, `dte_sello_recepcion`

### Seguridad Financiera (PCI-DSS SAQ-A)

- **NUNCA** almacenar números de tarjeta raw
- Solo tokens del gateway (Stripe/MercadoPago)
- Formulario de tarjeta = iframe del gateway
- `gateway_token` en tabla `payment_methods` — único dato sensible

---

## 12. MARKETPLACE

- Solo disponible para planes `pro`, `elite`, `enterprise`
- 6 canales de compra: lista, texto, voz (ARIA), foto/cámara, re-orden, chat
- IA visual: Google Vision API + GPT-4o para identificar productos por foto
- Sistema de crédito para miembros (configurable por gym)
- Crédito ≠ Wallet: crédito es deuda del miembro al gym; wallet es saldo positivo
- POS integrado con caja registradora física
- Suscripciones de productos (auto-reorden por frecuencia)
- Caja del Mes: $60/mes delivery, $55 pickup

---

## 13. WORKOUT BUILDER (ZEUS)

### Periodización Recomendada

```yaml
progression_type: double_progression # (recomendado)
regla: 'Cuando completes 3×12 con buena técnica → próxima semana 3×10 con +2.5kg'
```

### Tipos de Bloque

`standard`, `warmup`, `superset`, `giant_set`, `circuit`, `emom`, `amrap`, `tabata`, `drop_set`, `pyramid`, `rest_pause`, `cooldown`

### Motor de Investigación Científica

- Monitoreo mensual automático de 5 revistas peer-reviewed
- Fuentes: JSCR, MSSE, Sports Medicine, NSCA, ACSM
- Expertos monitoreados: Schoenfeld, Galpin, Helms, Norton, McGill
- Cola de aprobación con 4 niveles (IA auto / Admin / Admin+Trainer / Admin+Profesional Salud)

---

## 14. BIOMETRÍA Y SALUD — RESTRICCIONES DE DATOS

```
REGLA ABSOLUTA:
- Exámenes médicos: encriptados AES-256, solo el miembro y staff autorizado
- Datos biométricos faciales: edge local ÚNICAMENTE, nunca cloud
- PAR-Q y evaluaciones: no se usan para entrenar modelos
- Derecho al olvido: eliminación en 30 días tras solicitud
- Data breach: notificación documentada en < 72 horas
```

---

## 15. REQUERIMIENTOS DE MCP

Los siguientes MCP servers son necesarios para el desarrollo de GymApp:

### MCPs de Infraestructura

| MCP                             | Propósito                                             |
| ------------------------------- | ----------------------------------------------------- |
| `@supabase/mcp-server-supabase` | Gestión de base de datos PostgreSQL, migraciones, RLS |
| Railway MCP                     | Deploy, logs, environment variables                   |
| Cloudflare MCP                  | R2 storage, CDN, WAF config                           |
| Doppler MCP                     | Gestión de secrets por ambiente                       |

### MCPs de Pagos

| MCP             | Propósito                                   |
| --------------- | ------------------------------------------- |
| Stripe MCP      | Productos, precios, suscripciones, webhooks |
| MercadoPago MCP | Pagos LATAM, suscripciones                  |

### MCPs de Comunicación

| MCP                 | Propósito                                |
| ------------------- | ---------------------------------------- |
| Twilio MCP          | SMS, WhatsApp, Voice para notificaciones |
| Firebase MCP        | FCM push notifications para mobile       |
| SendGrid/Resend MCP | Emails transaccionales                   |

### MCPs de IA

| MCP            | Propósito                               |
| -------------- | --------------------------------------- |
| Anthropic MCP  | Claude API — ARIA, ZEUS, Business Coach |
| OpenAI MCP     | GPT-4o fallback + Whisper STT + Vision  |
| ElevenLabs MCP | TTS para voz de ARIA y ZEUS             |

### MCPs de Control de Acceso

| MCP               | Propósito                       |
| ----------------- | ------------------------------- |
| Kisi MCP (Fase 2) | Control de puertas inteligentes |

### MCPs de Monitoreo

| MCP        | Propósito                |
| ---------- | ------------------------ |
| Sentry MCP | Error tracking y alertas |

---

## 16. SKILLS Y TECNOLOGÍAS ESPECIALIZADAS

### Backend Core

- **NestJS 11** — módulos, decoradores, Guards, Interceptors, Middleware
- **tRPC v11** — type-safe API interna entre web y API
- **Prisma 6** — ORM, migraciones, RLS multi-tenant
- **BullMQ** — colas de trabajo (dunning, notifications, AI jobs)
- **Socket.io 4** — workout sessions real-time, notificaciones push

### Frontend Web

- **Next.js 15 App Router** — RSC, Server Actions, streaming
- **shadcn/ui** — sistema de diseño componible
- **TanStack Table v8** — tablas con filtros, sorting, paginación servidor
- **FullCalendar 6** — calendario de citas y clases
- **Recharts** — dashboards financieros y analytics
- **DnD Kit** — drag & drop para el workout builder

### Mobile

- **Expo Router** — navegación file-based para React Native
- **WatermelonDB** — SQLite offline-first para sesiones de workout sin internet
- **React Native Reanimated 3** — animaciones 60fps para gamificación
- **Expo Camera** — QR scanner para control de acceso

### Base de Datos Avanzada

- **pgvector** — embeddings ARIA/ZEUS RAG, facial recognition
- **pg_cron** — risk score recalculation, metric snapshots, dunning scheduler
- **pg_trgm** — búsqueda difusa en ejercicios y productos
- **Row Level Security** — aislamiento multi-tenant a nivel DB

### IA / ML

- **LangChain.js** — RAG pipeline, conversational chains, tool calling
- **InsightFace** — facial recognition (edge, no cloud)
- **Prompt engineering** — ARIA persona, ZEUS coaching persona, Business Coach

### Seguridad

- **HMAC-SHA256** — firmas QR de acceso
- **AES-256** — encriptación de exámenes médicos y datos sensibles
- **bcrypt** — hashing de PINs de acceso
- **Stripe Radar** — detección de fraude en pagos
- **Doppler** — secrets management (nunca .env en producción)

### Infraestructura

- **Turborepo** — builds incrementales en monorepo
- **Docker** — contenedores para desarrollo y producción
- **GitHub Actions** — CI/CD pipeline
- **Railway CLI** — deploy desde terminal

---

## 17. ADRs (Architecture Decision Records)

Ver carpeta `docs/adr/`:

| ADR                                                      | Decisión                                              |
| -------------------------------------------------------- | ----------------------------------------------------- |
| [ADR-001](docs/adr/ADR-001-monolith-vs-microservices.md) | Modular Monolith en P1–P2, Microservices opcional P3+ |
| [ADR-002](docs/adr/ADR-002-multi-tenancy-rls.md)         | Shared DB + Shared Schema + PostgreSQL RLS            |
| [ADR-003](docs/adr/ADR-003-api-rest-trpc.md)             | REST para APIs externas + tRPC para web-admin interno |
| [ADR-004](docs/adr/ADR-004-railway-aws-migration.md)     | Railway P1–P2 → AWS ECS Fargate P3+                   |
| [ADR-005](docs/adr/ADR-005-dual-payment-gateway.md)      | Stripe primario (intl) + MercadoPago (LATAM)          |
| [ADR-006](docs/adr/ADR-006-offline-first-mobile.md)      | WatermelonDB para sesiones de workout offline         |
| [ADR-007](docs/adr/ADR-007-event-bus-internal.md)        | Event Bus pub/sub interno con GymEvent enum           |
| [ADR-008](docs/adr/ADR-008-white-label-ai-agents.md)     | Agentes IA con nombre configurable por gym            |
| [ADR-009](docs/adr/ADR-009-access-control-phasing.md)    | QR propio P1 → Kisi/NFC P2 → HID/Facial P3            |
| [ADR-010](docs/adr/ADR-010-edge-computing-access.md)     | Raspberry Pi edge para decisiones de acceso offline   |

---

## 18. CONVENCIONES DE CÓDIGO

### Nomenclatura

- **Tablas DB:** snake_case plural (`membership_types`, `workout_sessions`)
- **Columnas DB:** snake_case (`gym_id`, `created_at`, `is_active`)
- **Enums DB:** SCREAMING_SNAKE_CASE (`'ACTIVE'`, `'MEMBER_TRIAL'`)
- **Módulos NestJS:** PascalCase (`MembershipsModule`, `WorkoutModule`)
- **Servicios NestJS:** PascalCase + sufijo Service (`BillingService`)
- **Endpoints REST:** kebab-case (`/api/v1/workout-sessions`)
- **tRPC routers:** camelCase (`membershipRouter.getActive`)
- **Componentes React:** PascalCase (`MemberCard`, `WorkoutSession`)
- **Hooks:** prefijo `use` (`useMemberProfile`, `useWorkoutSession`)

### TypeScript

- Strict mode ON — no `any` implícito
- Todos los schemas de validación en `packages/shared-schemas` con Zod
- Tipos derivados de Zod con `z.infer<typeof schema>`
- Interfaces para tipos de dominio, types para unions/primitivos

### Base de Datos

- Siempre UUID v4 como PK (`gen_random_uuid()`)
- Siempre `gym_id` en tablas de negocio (multi-tenant)
- `created_at TIMESTAMP DEFAULT NOW()` en todas las tablas
- `updated_at` en tablas mutables (con trigger o Prisma)
- Índices en `(gym_id, created_at DESC)` para queries paginadas
- Nunca eliminar registros financieros — solo cambiar status

### Seguridad

- **NUNCA** commit de secrets — usar Doppler
- **NUNCA** exponer `gateway_token` en APIs — solo últimos 4 dígitos de tarjeta
- **SIEMPRE** validar `gym_id` del JWT vs `gym_id` del recurso
- **SIEMPRE** rate-limit endpoints de pago y autenticación
- Logs de auditoría para acciones financieras (quién, qué, cuándo)

---

## 19. PLAN DE FASES

| Fase           | Duración   | Foco                                                                       |
| -------------- | ---------- | -------------------------------------------------------------------------- |
| **MVP**        | 0–4 meses  | Membresías, Billing, Acceso QR, Workout básico, CRM core, Analytics básico |
| **Growth**     | 4–8 meses  | Marketplace, Gamificación, IA completa (ARIA/ZEUS), Nutrición, IoT acceso  |
| **Scale**      | 8–16 meses | Multi-sede, Biometría, BI avanzado, Microservices selectivos               |
| **Enterprise** | 16+ meses  | White-label, HID/Lenel, API pública, Data lake                             |

Ver `docs/PLAN_TRABAJO.md` para desglose completo de tareas por sprint.

---

## 20. GIT Y DEPLOYMENT

### Cuenta GitHub

- **Cuenta:** `jsiguenzatorres`
- **SSH alias:** `github-js`
- **Key:** `~/.ssh/id_ed25519_jsiguenzatorres`
- **Remote:** `git@github-js:jsiguenzatorres/GymApp.git` (por crear)

### Branching Strategy

```
main          ← producción (protegida)
develop       ← integración continua
feat/MOD-XXX  ← features por módulo
fix/issue-XXX ← bugfixes
```

### Variables de Entorno

Gestionadas con **Doppler** — NUNCA en `.env` commitado.

- `apps/api` — DATABASE_URL, REDIS_URL, STRIPE_SECRET, MERCADOPAGO_TOKEN, ANTHROPIC_API_KEY, JWT_SECRET, etc.
- `apps/web` — NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, etc.
- `apps/mobile` — EXPO_PUBLIC_API_URL, EXPO_PUBLIC_FCM_SENDER_ID, etc.

---

## 21. COSTOS ESTIMADOS

| Fase        | Infraestructura/mes | IA (100 miembros)/mes |
| ----------- | ------------------- | --------------------- |
| MVP (P1)    | ~$50–150            | ~$45–80               |
| Growth (P2) | ~$300–800           | ~$200–400             |
| Scale (P3)  | ~$2,000–8,000       | ~$500–2,000           |

**Rate limits IA:**

- Anthropic (Claude): 50 queries/miembro/día
- ElevenLabs TTS: 20 requests/miembro/día

---

_GymApp — App Integral de Gimnasio de Élite_
_Versión del documento: 1.0 — Junio 2026_
