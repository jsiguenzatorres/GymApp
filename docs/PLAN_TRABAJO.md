# Plan de Trabajo — GymApp

## App Integral de Gimnasio de Élite

> Actualizado: Junio 2026 | Estado: Planificación

---

## RESUMEN DE FASES

| Fase                                | Duración    | Objetivo                                     | Entregable                                                                             |
| ----------------------------------- | ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Fase 0**                          | Semanas 1–2 | Scaffolding del monorepo                     | Repo funcional, CI/CD, DB conectada                                                    |
| **MVP (Fase 1)**                    | Meses 1–4   | Producto mínimo vendible                     | Membresías + Billing + Acceso QR + Workout básico + CRM + Analytics                    |
| **Growth (Fase 2)**                 | Meses 4–8   | Expansión de funcionalidades                 | Marketplace + Gamificación + IA completa + Nutrición + IoT                             |
| **Scale (Fase 3)**                  | Meses 8–16  | Escala y robustez                            | Multi-sede + Biometría + BI avanzado + Microservices selectivos                        |
| **Enterprise & Diferidos (Fase 4)** | Meses 16+   | Mercado enterprise + tareas alta complejidad | Acceso IoT (Kisi/NFC), Facial, Multi-sede UI, DTE multi-país, White-label, API pública |

---

## FASE 0 — SCAFFOLDING (Semanas 1–2)

### Sprint 0.1 (Semana 1)

**Objetivo:** Monorepo, CI/CD y base de datos funcionales

#### Tareas

| ID    | Tarea                                                                  | Responsable | Días | Dependencias |
| ----- | ---------------------------------------------------------------------- | ----------- | ---- | ------------ |
| S0-01 | Inicializar Turborepo con apps/api, apps/web, apps/mobile, packages/\* | Dev         | 1    | —            |
| S0-02 | Configurar TypeScript strict mode en todos los packages                | Dev         | 0.5  | S0-01        |
| S0-03 | Setup ESLint + Prettier + Husky pre-commit hooks                       | Dev         | 0.5  | S0-01        |
| S0-04 | Crear proyecto en Railway.app (staging + production)                   | Dev         | 0.5  | —            |
| S0-05 | Provisionar PostgreSQL 16 en Railway con extensiones requeridas        | Dev         | 0.5  | S0-04        |
| S0-06 | Provisionar Redis (Upstash)                                            | Dev         | 0.5  | S0-04        |
| S0-07 | Configurar Doppler (staging, production, development)                  | Dev         | 1    | —            |
| S0-08 | GitHub repo: `git@github-js:jsiguenzatorres/GymApp.git`                | Dev         | 0.5  | S0-01        |
| S0-09 | GitHub Actions CI: lint + build + test en PR                           | Dev         | 1    | S0-02, S0-08 |
| S0-10 | GitHub Actions CD: auto-deploy a Railway en merge a main               | Dev         | 1    | S0-09        |

### Sprint 0.2 (Semana 2)

**Objetivo:** NestJS skeleton con multi-tenancy y auth skeleton

| ID    | Tarea                                                      | Días |
| ----- | ---------------------------------------------------------- | ---- |
| S0-11 | NestJS 11: módulos base (app, config, database, health)    | 1    |
| S0-12 | Prisma setup: schema inicial (gyms, users, staff, members) | 1    |
| S0-13 | TenantMiddleware: extracción gym_id de JWT y header        | 0.5  |
| S0-14 | RLS setup: activar en tablas gyms, staff, members          | 0.5  |
| S0-15 | JWT auth skeleton (login, refresh, logout)                 | 1    |
| S0-16 | RBAC Guards: @Roles decorator + RolesGuard                 | 0.5  |
| S0-17 | Next.js 15 App Router skeleton con layout y auth pages     | 1    |
| S0-18 | Expo React Native skeleton con Expo Router + auth flow     | 1    |
| S0-19 | Cloudflare R2: bucket config + upload service util         | 0.5  |
| S0-20 | Sentry integration en api, web y mobile                    | 0.5  |

**Entregable Fase 0:** Monorepo deployado en Railway, login funcional, health check endpoint, CI/CD verde.

---

## FASE 1 — MVP (Meses 1–4)

### Módulos incluidos en MVP

- `GYM-MOD-AUTH` — Auth completo con 2FA
- `GYM-MOD-GYMS` — Configuración del gym
- `GYM-MOD-STAFF` — Gestión de staff
- `GYM-MOD-MEM` — Membresías completas
- `GYM-MOD-BIL` — Billing y pagos
- `GYM-MOD-ACCESS` (P1) — Control de acceso QR
- `GYM-MOD-WKT` (core) — Workout builder básico sin IA
- `GYM-MOD-CRM-V` (core) — CRM básico (sin ARIA completa)
- `GYM-MOD-ANALYTICS` (básico) — Dashboard con KPIs esenciales
- `GYM-MOD-NOTIF` — Notificaciones esenciales

---

### Sprint 1.1 — Auth & Onboarding del Gym (Semanas 3–4)

| ID    | Tarea                                                     | Días | Módulo    |
| ----- | --------------------------------------------------------- | ---- | --------- |
| M1-01 | Auth completo: registro, login, refresh token, logout     | 2    | AUTH      |
| M1-02 | 2FA TOTP: setup, verify, backup codes                     | 1    | AUTH      |
| M1-03 | Password reset flow (email token)                         | 1    | AUTH      |
| M1-04 | Onboarding del gym: wizard de configuración inicial       | 2    | GYMS      |
| M1-05 | Gestión de staff: invite, roles, desactivar               | 2    | STAFF     |
| M1-06 | Perfil del gym: logo, horarios, redes sociales, políticas | 1    | GYMS      |
| M1-07 | Gestión de sedes (multi-sede básico para Phase 3)         | 1    | GYMS      |
| M1-08 | Web: páginas de auth (login, forgot password, 2FA)        | 2    | AUTH/WEB  |
| M1-09 | Web: wizard de onboarding del gym                         | 2    | GYMS/WEB  |
| M1-10 | Web: CRUD de staff con invitación por email               | 2    | STAFF/WEB |

### Sprint 1.2 — Membresías Core (Semanas 5–6)

| ID    | Tarea                                                          | Días | Módulo  |
| ----- | -------------------------------------------------------------- | ---- | ------- |
| M1-11 | Prisma schema: membership_types, memberships, member_wallets   | 1    | MEM     |
| M1-12 | CRUD catálogo de planes (membership_types)                     | 2    | MEM     |
| M1-13 | Alta de miembro: flujo de 7 pasos con foto y PAR-Q             | 2    | MEM     |
| M1-14 | Contrato digital: firma + OTP SMS + hash SHA-256 + PDF         | 2    | MEM     |
| M1-15 | Máquina de estados: LEAD→TRIAL→ACTIVE→FREEZE→EXPIRED→CANCELLED | 2    | MEM     |
| M1-16 | Freeze de membresía: solicitud, aprobación, extensión de fecha | 1.5  | MEM     |
| M1-17 | Renovación y cancelación con período de aviso                  | 1.5  | MEM     |
| M1-18 | Web: lista de miembros con filtros y búsqueda                  | 2    | MEM/WEB |
| M1-19 | Web: ficha completa del miembro (perfil, historial, docs)      | 2    | MEM/WEB |
| M1-20 | Web: modal de alta rápida (recepcionista)                      | 1    | MEM/WEB |

### Sprint 1.3 — Billing & Pagos (Semanas 7–9)

| ID    | Tarea                                                                 | Días | Módulo  |
| ----- | --------------------------------------------------------------------- | ---- | ------- |
| M1-21 | Prisma schema: subscriptions, transactions, invoices, payment_methods | 1    | BIL     |
| M1-22 | Integración Stripe: customer, payment method, subscription            | 3    | BIL     |
| M1-23 | Integración MercadoPago: cobros recurrentes LATAM                     | 3    | BIL     |
| M1-24 | Motor de cobros: Subscription Engine con BullMQ                       | 2    | BIL     |
| M1-25 | Dunning Engine: Day 0→3→5→7→14 con BullMQ                             | 2    | BIL     |
| M1-26 | Webhook handlers: Stripe + MercadoPago (idempotente)                  | 2    | BIL     |
| M1-27 | Facturación básica: generación de facturas PDF                        | 1.5  | BIL     |
| M1-28 | DTE El Salvador: CF y CCF con proveedor autorizado                    | 2    | BIL     |
| M1-29 | Wallet del miembro: saldo, recargas, aplicar en cobro                 | 1.5  | BIL     |
| M1-30 | Cupones y descuentos: CRUD + aplicación en cobro                      | 1.5  | BIL     |
| M1-31 | Web: dashboard financiero básico (ingresos del día/mes)               | 2    | BIL/WEB |
| M1-32 | Web: gestión de métodos de pago y reintentos manuales                 | 1.5  | BIL/WEB |
| M1-33 | Web: historial de transacciones con filtros y export                  | 1.5  | BIL/WEB |

### Sprint 1.4 — Control de Acceso QR (Semanas 9–10)

| ID    | Tarea                                                         | Días | Módulo        |
| ----- | ------------------------------------------------------------- | ---- | ------------- |
| M1-34 | Prisma schema: access_controllers, access_doors, access_logs  | 1    | ACCESS        |
| M1-35 | Generador de QR: payload HMAC-SHA256, TTL 60s, nonce          | 1.5  | ACCESS        |
| M1-36 | Validador de acceso: 8-step decision tree                     | 2    | ACCESS        |
| M1-37 | Endpoint MQTT-over-HTTP para controlador físico               | 1.5  | ACCESS        |
| M1-38 | Logs de acceso: inmutables (CREATE RULE), con member snapshot | 1    | ACCESS        |
| M1-39 | Aforo en tiempo real: conteo por zona                         | 1    | ACCESS        |
| M1-40 | Visitor passes: generación y validación                       | 1    | ACCESS        |
| M1-41 | Mobile: pantalla QR del miembro (animado, auto-refresh)       | 1.5  | ACCESS/MOBILE |
| M1-42 | Web: dashboard de acceso en tiempo real                       | 1.5  | ACCESS/WEB    |
| M1-43 | Web: log de accesos con filtros (quién, cuándo, resultado)    | 1    | ACCESS/WEB    |

### Sprint 1.5 — Workout Builder Básico (Semanas 11–12)

| ID    | Tarea                                                                                          | Días | Módulo     |
| ----- | ---------------------------------------------------------------------------------------------- | ---- | ---------- |
| M1-44 | Prisma schema: exercises, training_plans, training_days, exercise_blocks, prescribed_exercises | 1.5  | WKT        |
| M1-45 | Biblioteca de ejercicios: CRUD con multimedia (video/gif/foto)                                 | 2    | WKT        |
| M1-46 | Workout Builder UI: drag & drop de ejercicios en el plan                                       | 3    | WKT/WEB    |
| M1-47 | Plantillas de rutinas: crear, clonar, asignar a miembro                                        | 2    | WKT        |
| M1-48 | Asignación de planes: trainer → miembro con fecha inicio                                       | 1    | WKT        |
| M1-49 | Prisma schema: workout_sessions, executed_sets, personal_records                               | 1    | WKT        |
| M1-50 | Mobile: pantalla de sesión activa (lista de ejercicios + timer)                                | 3    | WKT/MOBILE |
| M1-51 | Mobile: registro de series (peso, reps, RPE) con offline support                               | 2    | WKT/MOBILE |
| M1-52 | Mobile: dashboard de progreso básico (PRs, historial)                                          | 2    | WKT/MOBILE |
| M1-53 | Web: vista del trainer — progreso de alumnos                                                   | 2    | WKT/WEB    |

### Sprint 1.5b — Importación masiva de biblioteca de ejercicios (Semana 12.5)

> Fuente: `Diseño/Ver2/Investigacion_Fuentes_Biblioteca_Ejercicios.md`. Script ya creado en `apps/api/scripts/import-exercises.mjs`.

| ID     | Tarea                                                                                        | Días | Módulo     |
| ------ | -------------------------------------------------------------------------------------------- | ---- | ---------- |
| M1-53b | Correr script de importación capa 1+2 (free-exercise-db + wger) → ~1,200 ejercicios globales | 0.5  | WKT        |
| M1-53c | Validar muestra de 30 ejercicios y ajustar mapeo de músculos/equipamiento si hace falta      | 0.5  | WKT        |
| M1-53d | Agregar atribución a wger.de en pantalla "Acerca de" (CC-BY-SA compliance)                   | 0.5  | WEB/MOBILE |
| M1-53e | Re-correr deduplicador y consolidar ejercicios casi-idénticos                                | 0.5  | WKT        |

**Entregable:** ~1,200-1,500 ejercicios disponibles para todos los gyms. Costo: $0. Capa 3 (videos MuscleWiki) se pospone a post-lanzamiento.

### Sprint 1.6 — CRM Core + Notificaciones (Semanas 13–14)

| ID    | Tarea                                                                    | Días | Módulo       |
| ----- | ------------------------------------------------------------------------ | ---- | ------------ |
| M1-54 | Prisma schema: members (extendido), interaction_log, member_risk_history | 1    | CRM          |
| M1-55 | Risk Score engine: cálculo inicial de 12 señales con pg_cron             | 3    | CRM          |
| M1-56 | Pipeline de leads: LEAD→TRIAL con seguimiento                            | 2    | CRM          |
| M1-57 | Segmentación básica: filtros por plan, nivel, actividad                  | 1.5  | CRM          |
| M1-58 | Workflows básicos: WF-001 onboarding, WF-004 inactividad                 | 2    | CRM          |
| M1-59 | Notification Service: email (SendGrid) + SMS (Twilio) + push (FCM)       | 2    | NOTIF        |
| M1-60 | Templates de notificación por canal y evento                             | 1.5  | NOTIF        |
| M1-61 | Web: dashboard CRM — lista de miembros en riesgo                         | 2    | CRM/WEB      |
| M1-62 | Web: ficha CRM — timeline de interacciones, score, workflows             | 2    | CRM/WEB      |
| M1-63 | Mobile: notificaciones push básicas                                      | 1    | NOTIF/MOBILE |

### Sprint 1.7 — Analytics Básico + QA MVP (Semanas 15–16)

| ID    | Tarea                                                               | Días | Módulo        |
| ----- | ------------------------------------------------------------------- | ---- | ------------- |
| M1-64 | Prisma schema: metric_snapshots, dashboard_kpis (materialized view) | 1.5  | ANALYTICS     |
| M1-65 | KPIs esenciales: MRR, miembros activos, churn, ingresos del día     | 2    | ANALYTICS     |
| M1-66 | pg_cron: job diario de metric_snapshots a las 2:00 AM               | 1    | ANALYTICS     |
| M1-67 | Materialized view refresh: CONCURRENTLY cada hora                   | 0.5  | ANALYTICS     |
| M1-68 | Web: dashboard ejecutivo — 8 KPI cards + gráfica MRR                | 2    | ANALYTICS/WEB |
| M1-69 | Web: reporte de cobros fallidos + recuperación                      | 1.5  | ANALYTICS/WEB |
| M1-70 | QA: testing E2E del flujo crítico (alta → cobro → acceso → workout) | 3    | QA            |
| M1-71 | Load testing: validar throughput de acceso QR concurrente           | 1    | QA            |
| M1-72 | Security audit: OWASP Top 10 básico en endpoints de pago            | 1.5  | SEGURIDAD     |
| M1-73 | Documentación de API (OpenAPI/Swagger) para módulos MVP             | 1    | DOCS          |

**Entregable MVP:** Sistema funcional end-to-end. Gym puede registrarse, configurar planes, cobrar membresías, controlar acceso por QR, y los miembros pueden entrenar con la app móvil.

---

## FASE 2 — GROWTH (Meses 4–8)

### Módulos nuevos en Growth

- `GYM-MOD-MKT` — Marketplace completo
- `GYM-MOD-GAME` — Gamificación & Comunidad
- `GYM-MOD-NUTRI` — Nutrición IA
- `GYM-MOD-LEADS` — Pipeline de leads avanzado
- `GYM-MOD-CONTENT` — Blog & Contenido
- `GYM-MOD-SCHED` — Clases & Horarios
- `GYM-MOD-FEEDBACK` — Feedback & NPS
- `GYM-MOD-ACCESS` (P2) — IoT + NFC + BLE
- `GYM-MOD-WKT` (IA) — ZEUS AI Coach completo
- `GYM-MOD-CRM-V` (IA) — ARIA Virtual Assistant completo
- `GYM-MOD-ANALYTICS` (full) — BI avanzado, Business Coach IA

---

### Sprint 2.1 — ARIA Virtual Assistant (Meses 4.0–4.5)

| ID    | Tarea                                                           | Días |
| ----- | --------------------------------------------------------------- | ---- |
| G2-01 | RAG pipeline: LangChain.js + pgvector knowledge base            | 3    |
| G2-02 | ARIA persona: prompt engineering + system prompt configurable   | 2    |
| G2-03 | Integración WhatsApp Business API (Meta)                        | 2    |
| G2-04 | Integración Telegram Bot API                                    | 1.5  |
| G2-05 | Chat en app móvil con ARIA                                      | 2    |
| G2-06 | Flujos conversacionales: consultas, citas, renovaciones, quejas | 3    |
| G2-07 | Escalada a humano: detección de frustración + handoff al staff  | 1.5  |
| G2-08 | Workflows completos: WF-002 a WF-008                            | 3    |
| G2-09 | ARIA Voice: ElevenLabs TTS + Whisper STT                        | 2    |
| G2-10 | Rate limiting 50 queries/miembro/día                            | 0.5  |

### Sprint 2.2 — ZEUS AI Coach + Sustitución (Meses 4.5–5.0)

| ID    | Tarea                                                                       | Días |
| ----- | --------------------------------------------------------------------------- | ---- |
| G2-11 | ZEUS persona: prompt engineering + 4-layer knowledge base                   | 2    |
| G2-12 | ZEUS voz: comandos "Hey ZEUS" + Whisper STT + ElevenLabs TTS                | 2.5  |
| G2-13 | Algoritmo de sustitución inteligente (similitud muscular ≥80%)              | 2    |
| G2-14 | AI Co-Pilot para trainers: generación de planes desde descripción           | 3    |
| G2-15 | Análisis de balance muscular: empuje/jale, alertas de desequilibrio         | 2    |
| G2-16 | Periodización automática: linear, DUP, block, conjugate, double progression | 3    |
| G2-17 | Deload automático: detección de fatiga por métricas                         | 1.5  |
| G2-18 | Recovery Score: integración Apple HealthKit / Google Fit / Garmin / Oura    | 3    |
| G2-19 | Motor de investigación científica: monitoreo PubMed + RSS mensual           | 2    |
| G2-20 | Panel de aprobación de contenido científico (4 niveles)                     | 2    |

### Sprint 2.3 — Marketplace Core (Meses 5.0–5.5)

| ID    | Tarea                                                                  | Días |
| ----- | ---------------------------------------------------------------------- | ---- |
| G2-21 | Prisma schema: products, product_variants, inventory_movements         | 1    |
| G2-22 | Catálogo de productos: CRUD con variantes, precios, stock, multimedia  | 3    |
| G2-23 | Inventario: movimientos, alertas de stock mínimo, reservas 15min       | 2    |
| G2-24 | Prisma schema: marketplace_orders, marketplace_order_items             | 0.5  |
| G2-25 | Flujo de compra: carrito → checkout → pago → fulfillment               | 3    |
| G2-26 | POS integrado: caja, turnos, efectivo, devoluciones                    | 2.5  |
| G2-27 | Prisma schema: member_credit_accounts, credit_account_movements        | 0.5  |
| G2-28 | Sistema de crédito: límites, 5 niveles de suspensión, cobro automático | 3    |
| G2-29 | Suscripciones de productos (auto-reorden por frecuencia)               | 1.5  |
| G2-30 | Wishlist + notificaciones de precio y stock                            | 1    |

### Sprint 2.4 — Marketplace IA + Canales Avanzados (Meses 5.5–6.0)

| ID    | Tarea                                                              | Días |
| ----- | ------------------------------------------------------------------ | ---- |
| G2-31 | ARIA ordena por voz: NLU + búsqueda semántica en catálogo          | 3    |
| G2-32 | Compra por foto: Google Vision API + GPT-4o Visual → producto      | 2.5  |
| G2-33 | Motor de recomendaciones IA: 7 fuentes (goal, historial, CF, etc.) | 3    |
| G2-34 | Smart combos: bundle automático por perfil + precio calculado      | 2    |
| G2-35 | Caja del Mes: suscripción mensual, armado por nutricionista        | 2    |
| G2-36 | Vitrina pública (sin login) con SEO y meta tags                    | 1.5  |
| G2-37 | Galería "Resultados con Productos" + moderación                    | 1    |
| G2-38 | Compra grupal: pedido compartido entre miembros                    | 2    |
| G2-39 | Etiquetado dietético: vegano, sin gluten, sin lactosa, etc.        | 1    |
| G2-40 | Reportes marketplace: ventas, stock, crédito, canal ROI            | 2    |

### Sprint 2.5 — Gamificación & Comunidad (Meses 6.0–6.5)

| ID    | Tarea                                                                  | Días |
| ----- | ---------------------------------------------------------------------- | ---- |
| G2-41 | Prisma schema: gamification_config, member_points, points_transactions | 1    |
| G2-42 | Motor de puntos: reglas configurables, anti-abuso, expiración          | 3    |
| G2-43 | Prisma schema: badge_catalog, member_badges                            | 0.5  |
| G2-44 | Sistema de medallas: 14 tipos, comunes/raras/legendarias, triggers     | 2.5  |
| G2-45 | Niveles de fidelidad: Bronce→Élite, beneficios por nivel               | 1.5  |
| G2-46 | Prisma schema: challenges, challenge_participants                      | 0.5  |
| G2-47 | Challenges: individuales, grupales, gym-wide con leaderboard           | 2.5  |
| G2-48 | Prisma schema: social_posts, social_reactions, social_comments         | 0.5  |
| G2-49 | Feed social: posts auto y manuales, moderación, reactions              | 2.5  |
| G2-50 | Buddy matching: algoritmo afinidad por goal + horario                  | 2    |
| G2-51 | Prisma schema: referral_links, referrals                               | 0.5  |
| G2-52 | Sistema de referidos: código único, tracking, recompensa automática    | 2    |
| G2-53 | Prisma schema: reward_catalog, reward_redemptions                      | 0.5  |
| G2-54 | Tienda de recompensas: canjes de puntos por descuentos/productos       | 2    |
| G2-55 | No-code Rule Engine: UI para configurar reglas de puntos sin código    | 3    |

### Sprint 2.6 — Nutrición IA (Meses 6.5–7.0)

| ID    | Tarea                                                              | Días |
| ----- | ------------------------------------------------------------------ | ---- |
| G2-56 | Prisma schema: nutrition_plans, food_diary, foods_database         | 1.5  |
| G2-57 | Calculadora TMB: Harris-Benedict + Mifflin-St Jeor + Katch-McArdle | 1    |
| G2-58 | Generador de plan nutricional con IA (macros, comidas, recetas)    | 3    |
| G2-59 | Base de datos de alimentos: USDA + alimentos locales LATAM         | 2    |
| G2-60 | Registro de comidas: búsqueda, escaneo de código de barras, foto   | 2.5  |
| G2-61 | Análisis nutricional del carrito de marketplace                    | 1.5  |
| G2-62 | Integración ZEUS ↔ Nutrición: ajuste calórico post-sesión          | 1.5  |
| G2-63 | Web: panel del nutricionista con todos sus pacientes               | 2    |
| G2-64 | Mobile: pantalla de nutrición diaria + macros + registro           | 2.5  |

### Sprint 2.7 — Clases, Horarios & Feedback (Meses 7.0–7.5)

> Control de Acceso P2 (Kisi/NFC/MQTT) movido a **Sprint 4.A** para análisis técnico extenso.

| ID    | Tarea                                                            | Días |
| ----- | ---------------------------------------------------------------- | ---- |
| G2-65 | Módulo de clases: horarios, instructores, capacidad, inscripción | 3    |
| G2-66 | Reservas de clases: lista de espera, cancelación, notificaciones | 2    |
| G2-67 | Web: calendario de clases (FullCalendar) con drag & drop         | 2    |
| G2-68 | Mobile: explorar y reservar clases                               | 2    |
| G2-69 | Feedback & NPS: encuestas post-clase, post-visita, NPS mensual   | 2    |

### Sprint 2.8 — Analytics Full + Blog + QA Growth (Meses 7.5–8.0)

| ID    | Tarea                                                                    | Días |
| ----- | ------------------------------------------------------------------------ | ---- |
| G2-74 | Business Coach IA: queries en lenguaje natural al dashboard              | 3    |
| G2-75 | Análisis de cohortes: retención mensual por cohorte                      | 2    |
| G2-76 | Churn radar: top 10 miembros en riesgo con score detallado               | 1.5  |
| G2-77 | 25+ reportes del catálogo: financiero, membresías, acceso, workout       | 4    |
| G2-78 | Exportación de reportes: PDF, Excel, CSV                                 | 1.5  |
| G2-79 | Alert rules: configuración de alertas por umbral (MRR caída, churn pico) | 2    |
| G2-80 | Blog & contenido: editor Tiptap, categorías, SEO, moderación             | 3    |
| G2-81 | QA: testing integración ARIA + Marketplace + Gamificación                | 3    |
| G2-82 | Performance testing: 500 membr concurrentes, QR y payments               | 2    |
| G2-83 | Documentación API Growth (OpenAPI actualizado)                           | 1    |

### Sprint 2.9 — Mecánicas Comerciales & Workout Avanzado (Meses 7.5–8.0)

> Pendientes detectados al cruzar el diseño Growth con `Diseño/Ver2/Estrategia_Comercial_GoToMarket.md` y `Modulo_Workout_Builder_Progreso.md`.

**Mecánicas comerciales (SaaS B2B):**

| ID    | Tarea                                                                                | Días |
| ----- | ------------------------------------------------------------------------------------ | ---- |
| G2-84 | Plan Fundadores: schema `founder_plans`, precio congelado, badge, cupo limitado (50) | 2    |
| G2-85 | UI de selección de plan con contador de cupos Fundador en tiempo real                | 1    |
| G2-86 | Programa Partners: schema `partners`, `partner_referrals`, tracking de comisiones    | 2    |
| G2-87 | Portal de partners (web): registro, dashboard de referidos, payouts                  | 3    |
| G2-88 | Health Score B2B del gym: cálculo, dashboard interno, alertas Customer Success       | 2.5  |
| G2-89 | Workflows internos de Account Manager (intervención por health score)                | 1.5  |
| G2-90 | Funnel tracking: Awareness → Interest → Trial → Paid con eventos                     | 1.5  |

**Workout Builder avanzado:**

| ID    | Tarea                                                                         | Días |
| ----- | ----------------------------------------------------------------------------- | ---- |
| G2-91 | Mapa Muscular SVG interactivo en mobile (highlight de músculos trabajados)    | 3    |
| G2-92 | Motor de Investigación Científica Continua: scraping mensual PubMed/JSCR/MSSE | 3    |
| G2-93 | Cola de aprobación de investigación con 4 niveles (UI web admin)              | 2    |
| G2-94 | Voice cloning de trainer para ZEUS (ElevenLabs) — opt-in por trainer          | 2.5  |
| G2-95 | Sustitución inteligente de ejercicios: cálculo de similitud Jaccard + UI      | 2    |

**Entregable Growth (incluye 2.9):** Sistema completo con IA conversacional, marketplace, gamificación, nutrición y herramientas comerciales para vender SaaS B2B (Fundadores, Partners, Customer Success).

### Sprint D — Monetización Nutrición (paralelo, transversal)

> Modelo de monetización por add-on suscripción del miembro. El gym vende el add-on al miembro y se queda con el margen (GymApp cobra 20% de comisión sobre add-ons). 3 tiers: BASIC (incluido) · NutriPro $15/mes · NutriElite $30/mes.

**Fase 1 — Infraestructura + UI tier-aware (HECHO)**

| ID   | Tarea                                                                         | Días |
| ---- | ----------------------------------------------------------------------------- | ---- |
| D-01 | Schema `member_addons` (member_id, type, tier, status, starts_at, ends_at)    | 0.5  |
| D-02 | AddonsService: getMemberNutritionTier + assign/cancel atómicos                | 1    |
| D-03 | Endpoints member (`/me/addons`) y admin (`/admin/members/:id/addons` CRUD)    | 0.5  |
| D-04 | Mobile: nutrition.tsx tier-aware con paywall modal y `LockedFeature` reusable | 2    |
| D-05 | Web admin: `AddonsSection` en ficha de miembro con activar/cancelar manual    | 1    |

**Fase 2 — Features Premium reales (Pendiente, ~3 sprints adicionales)**

| ID   | Tarea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Tier  | Días |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- |
| D-10 | Base USDA + alimentos LATAM (importación inicial)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | PRO   | 3    |
| D-11 | UI registro manual de comida con búsqueda                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | PRO   | 2    |
| D-12 | Escaneo código de barras (`expo-barcode-scanner`) + lookup OpenFoodFacts                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | PRO   | 2    |
| D-13 | Histórico 30 días: calendario navegable + gráfica calórica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | PRO   | 2    |
| D-14 | Recordatorios push inteligentes (notificaciones por hora)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | PRO   | 1.5  |
| D-15 | Foto del plato → Gemini Vision identifica alimentos + estima macros                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | ELITE | 4    |
| D-16 | Plan adaptativo semanal (IA ajusta calorías según peso/sesiones)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | ELITE | 3    |
| D-17 | Generador de recetas IA con ingredientes del usuario                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ELITE | 2    |
| D-18 | Bot WhatsApp: NL → registro automático ("comí 200g pollo")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ELITE | 3    |
| D-19 | 🟡 **Código listo, API verificada contra los tipos publicados, SIN PROBAR en dispositivo** (2026-07-06) — `lib/health-sync.ios.ts` (HealthKit vía `@kingstinct/react-native-healthkit@8.7.2` — fijado en esa versión porque 9+ requieren react-native≥0.79/react≥19, este proyecto está en 0.76.9/18.3.1) + `lib/health-sync.android.ts` (Health Connect vía `react-native-health-connect@3.5.3`), resueltos automáticamente por plataforma (Metro `.ios.ts`/`.android.ts`). Reusa `POST /me/health-data/bulk-import` que ya existía. Ver nota abajo | ELITE | 4    |
| D-20 | Reporte mensual PDF para nutricionista humano                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | PRO+  | 1.5  |
| D-21 | Lista de compras semanal auto-generada                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | PRO+  | 1    |
| D-22 | Caja del mes incluida (cross-sell con marketplace del gym)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | ELITE | 1    |

> **D-19 — pasos pendientes para verificar (no completables desde este entorno de trabajo):**
>
> 1. Correr `npx expo install @kingstinct/react-native-healthkit react-native-health-connect` desde `apps/mobile` (ya están en `package.json`, pero `expo install` resuelve las versiones exactas compatibles con Expo SDK 52 — este sandbox no tiene salida de red confiable para hacerlo).
> 2. **iOS:** habilitar el capability "HealthKit" en tu App ID en el Apple Developer Portal (requiere cuenta de pago) antes de que `eas build` genere un provisioning profile válido — si no, el build de iOS fallará o instalará sin el entitlement.
> 3. **Android:** Health Connect requiere que el usuario tenga la app "Health Connect" instalada (Android 14+ la trae de fábrica; en versiones anteriores hay que instalarla desde Play Store).
> 4. Probar en un dispositivo físico real — HealthKit no reporta datos reales en el simulador de iOS, y Health Connect necesita datos ya existentes en el teléfono (de otra app como Google Fit, Samsung Health, etc.) para tener algo que sincronizar.
> 5. La forma exacta de las respuestas de ambas librerías (`queryQuantitySamples`, `readRecords`) puede variar entre versiones — revisar los tipos de la versión instalada en `node_modules` antes de confiar en el código en producción; dejé comentarios `⚠️ NO VERIFICADO` en los dos archivos (`lib/health-sync.ios.ts`, `lib/health-sync.android.ts`) marcando esto.
> 6. Antes de subir a Play Store/App Store con este permiso, ambas tiendas piden declaraciones de privacidad de datos de salud (Google Play "Data safety" y Apple "App Privacy" — sección de datos de salud es sensible en ambas).

**Fase 3 — Brechas detectadas al auditar contra `Diseño/Modulo_Nutricion_Completo.md` (auditoría 2026-07-05)**

> El motor de logging, IA generativa y tiers ya está sólido (Fase 1+2 arriba). Esta auditoría cruzó el documento de diseño completo (20 secciones) contra el código real y encontró piezas del diseño original que aún no existen. `Módulo` indica dónde vive el trabajo — importante porque **ninguna de estas brechas afecta al build/APK ya generado**: el mobile actual (logging, foto, barcode, texto, recetas, lista de compras, análisis adaptativo) ya está completo y no requiere cambios para que se pruebe. Estas tareas son trabajo nuevo, no arreglos a lo ya empacado.

| ID   | Tarea                                                                                                                                                                                                                                                                                                                                                                                                                   | Prioridad  | Módulo                 | Días |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- | ---- |
| D-23 | ✅ **HECHO** (2026-07-05) — Motor de detección de riesgo alimentario (TCA): tabla `nutrition_risk_alerts`, reglas (kcal<1200/7d, ≥7 registros/día), alerta al nutricionista en `/nutrition`, pausa automática de sugerencias de déficit en `aiSuggest`/análisis adaptativo                                                                                                                                              | 🔴 CRÍTICA | API + Web (alertas)    | 4    |
| D-24 | ✅ **HECHO** (2026-07-05) — Bloqueo de `createPlan(goal=WEIGHT_LOSS)` si `antecedente_tca_declarado=true` y `tca_clinical_review_completed=false`; se desbloquea marcando la revisión clínica en el perfil                                                                                                                                                                                                              | 🔴 CRÍTICA | API + Web (perfil)     | 1    |
| D-25 | ✅ **HECHO** (2026-07-05) — Tabla `member_nutrition_profiles` (alergias, dieta base, presupuesto, tiempo de cocina, condiciones médicas, altura, nivel de actividad, favoritos/a evitar) + card de edición en el detalle del plan (web)                                                                                                                                                                                 | 🟠 ALTA    | API + Web              | 3    |
| D-26 | ✅ **HECHO** (2026-07-05) — Motor TMB/TDEE real (Mifflin-St Jeor + Katch-McArdle si hay % grasa reciente, factor de actividad con sugerencia por asistencia real) — botón "Calcular con TMB/TDEE" prellena el formulario de nuevo plan                                                                                                                                                                                  | 🟠 ALTA    | API + Web (crear plan) | 3    |
| D-27 | ✅ **HECHO** (2026-07-05) — Nutrient timing adaptado a la arquitectura real: `WorkoutPlanDay.day_number` es una posición dentro de un split rotativo, no un día fijo de la semana, así que no hay calendario semanal que vincular. En su lugar, `getTodayAdjustedMacros` ajusta carbos ±12% HOY según si el miembro ya entrenó (sesión iniciada hoy), reactivo en vez de un JSON semanal fijo. Mostrado en web y mobile | 🟡 MEDIA   | API + Web + Mobile     | 2    |
| D-28 | ✅ **HECHO** (2026-07-05) — 6 plantillas seleccionables en crear plan (Déficit Alta Proteína, Superávit Limpio, Recomposición, Mantenimiento, Rendimiento, Vegano Alto Rendimiento) — recalculan macros por % sobre el kcal_target actual                                                                                                                                                                               | 🟡 MEDIA   | Web                    | 1.5  |
| D-29 | ✅ **HECHO** (2026-07-05) — Análisis de laboratorio: tabla `lab_results`, extracción de marcadores por **foto o PDF** vía Gemini Vision (`StorageService.uploadDocument`, Gemini soporta PDF nativo via `inlineData` — sin necesidad de convertir a imagen), gate `reviewed_by_nutritionist` con endpoints restringidos a GYM_OWNER/GYM_ADMIN/NUTRITIONIST (`RolesGuard`)                                               | 🟠 ALTA    | API + Web              | 4    |
| D-30 | ✅ **HECHO** (2026-07-05) — `RecipeGenerator` en detalle de plan (chips de ingredientes + preferencias)                                                                                                                                                                                                                                                                                                                 | 🟡 MEDIA   | Web                    | 1    |
| D-31 | ✅ **HECHO** (2026-07-05) — `ShoppingList` en detalle de plan (categorías + costo estimado)                                                                                                                                                                                                                                                                                                                             | 🟡 MEDIA   | Web                    | 1    |
| D-32 | ✅ **HECHO** (2026-07-05) — `PhotoAnalyzer` en detalle de plan; registra al diario con el mismo matching por nombre que usa mobile                                                                                                                                                                                                                                                                                      | 🟡 MEDIA   | Web                    | 1.5  |
| D-33 | ✅ **HECHO** (2026-07-05) — `AdaptiveAnalysis` en detalle de plan, con botón "Aplicar ajuste" que refresca el plan                                                                                                                                                                                                                                                                                                      | 🟡 MEDIA   | Web                    | 1.5  |
| D-34 | ✅ **HECHO** (2026-07-05) — edición inline de nombre/objetivo/macros en el detalle del plan + historial de cambios (ver D-39, ya no es parcial)                                                                                                                                                                                                                                                                         | 🟡 MEDIA   | Web                    | 1    |
| D-35 | ✅ **HECHO** (2026-07-05) — Página `/nutrition/food-library`: CRUD completo (buscar/crear/editar/eliminar) sin llamar la API directamente. Editar es seguro con historial (logFood copia macros al registrar, no los relee). Eliminar bloqueado si tiene entradas de diario asociadas (mensaje explicativo). Alimentos globales (gym_id=null) no editables/eliminables desde ningún gym                                 | 🟢 BAJA    | Web                    | 1.5  |
| D-36 | ✅ **HECHO** (2026-07-05) — Botón de micrófono en `nutrition-text-log.tsx` usando `useStt` (mismo hook de ARIA/ZEUS) — transcribe y prellena el input para revisión antes de registrar                                                                                                                                                                                                                                  | 🟢 BAJA    | Mobile                 | 1    |
| D-37 | ✅ **HECHO** (2026-07-05) — `POST /nutrition/copilot-chat`: chat multi-turno (Gemini con historial) que lee perfil/alergias/plan activo y propone macros + un día de ejemplo; respeta guardrails TCA/alerta de riesgo; botón "Usar este plan" prellena el formulario de crear plan                                                                                                                                      | 🟡 MEDIA   | API + Web              | 3    |
| D-38 | ✅ **HECHO** — `scripts/seed-food-items.mjs` con ~148 alimentos LATAM/USDA, idempotente (ya existía en el repo, se documentó en `scripts/README.md`)                                                                                                                                                                                                                                                                    | 🟢 BAJA    | API                    | 1    |
| D-39 | ✅ **HECHO** (2026-07-05) — Tabla `nutrition_plan_history`: snapshot automático de los valores anteriores en `updatePlan` cuando cambia nombre/objetivo/macros; botón "Historial" en el detalle del plan                                                                                                                                                                                                                | 🟢 BAJA    | API + Web              | 1    |

> D-18 (Bot WhatsApp) y D-19 (Apple Health/Google Fit), listados en Fase 2 como pendientes, se confirmaron ausentes en esta auditoría — se mantienen en su prioridad original, sin duplicar aquí.

> **Nota de despliegue (D-23 a D-26 y D-29):** ✅ migraciones `20260705150000_nutrition_profile_risk_tmb` y `20260705160000_lab_results` aplicadas en Supabase (2026-07-05, `npx prisma migrate deploy` corrido por el usuario desde su máquina — este entorno de trabajo no tiene acceso de red al pooler de la DB ni al proyecto correcto vía MCP). Código y schema en sync con la base de datos real.
>
> **Nota de despliegue (D-39):** ✅ migración `20260705180000_nutrition_plan_history` aplicada en Supabase (2026-07-05, `npx prisma migrate deploy` corrido por el usuario). Las 3 migraciones de esta sesión (perfil/riesgo/TMB, lab results, historial de planes) están sincronizadas con la base de datos real. El resto del trabajo (D-27, D-28, D-30 a D-38) no tocó el schema.
>
> **Actualización (2026-07-06):** se resolvieron las dos limitaciones anteriores. D-29 ahora acepta PDF además de foto (Gemini lo procesa nativo, no hizo falta conversión). D-35 ahora tiene edición y borrado completos, con las salvaguardas correspondientes (borrado bloqueado si hay historial de diario asociado; alimentos globales no editables desde un gym individual).

**Billing automático del add-on (futuro)**: integrar con Stripe/MercadoPago para que la suscripción mensual se cobre sola al miembro y el gym reciba el neto.

**Resultado esperado del modelo**: gym de 200 miembros con 25% Pro + 10% Elite → **~$1,080/mes extra netos al gym** sin contratar nutricionista adicional.

---

### Sprint Y — Billing Avanzado, WhatsApp y Scheduling Avanzado (transversal, 2026-07-06/07)

> Gaps encontrados en la auditoría del módulo de Membresías/Billing y del módulo de Scheduling/Citas (`Diseño/Ver2/Modulo_Scheduling_Citas-1.md`). Se dejó pendiente explícitamente DTE El Salvador, firma de contrato digital y notificaciones SMS/Email — quedan para una entrega futura, a pedido del usuario.

| ID   | Tarea                                                                                                                                                                                                                                                                                                                | Prioridad | Alcance            | Días |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------ | ---- |
| Y-01 | ✅ **HECHO** (2026-07-06) — Checkout de MercadoPago habilitado en `me/billing/checkout` (Preference real, ya no stub)                                                                                                                                                                                                | 🟠 ALTA   | API                | 1    |
| Y-02 | ✅ **HECHO** (2026-07-06) — Procesador de webhooks activa `BillingSubscription` + crea `Membership` automáticamente al confirmarse el pago (Stripe y MercadoPago)                                                                                                                                                    | 🟠 ALTA   | API                | 2    |
| Y-03 | ✅ **HECHO** (2026-07-06) — Dunning: reintento real de cobro (tarjeta/token guardado) en días 3/5/7 antes de notificar fallo                                                                                                                                                                                         | 🟠 ALTA   | API                | 1.5  |
| Y-04 | ✅ **HECHO** (2026-07-06) — Sistema de cupones/descuentos: CRUD + aplicación en checkout de autoservicio y asignación manual de membresía                                                                                                                                                                            | 🟡 MEDIA  | API + Web          | 3    |
| Y-05 | ✅ **HECHO** (2026-07-06) — Auto-renovación de suscripciones de autoservicio (cron diario, cobra tarjeta guardada y extiende membresía; el fallo alimenta el flujo de dunning existente)                                                                                                                             | 🟡 MEDIA  | API                | 2    |
| Y-06 | ✅ **HECHO** (2026-07-07) — Integración WhatsApp Business Cloud API (solo mensajería, sin llamadas de voz): envío de plantillas, webhook de verificación/recepción, firma HMAC                                                                                                                                       | 🟠 ALTA   | API                | 2    |
| Y-07 | ✅ **HECHO** (2026-07-07) — WhatsApp conectado a recordatorios de cobro (dunning), retención (inactividad/renovación) y anuncios masivos (broadcast)                                                                                                                                                                 | 🟡 MEDIA  | API + Web          | 2    |
| Y-08 | ✅ **HECHO** (2026-07-07) — Check-in/asistencia/no-show para clases grupales: roster con marcar asistencia, cron horario que cierra sesiones vencidas                                                                                                                                                                | 🟠 ALTA   | API + Web          | 2.5  |
| Y-09 | ✅ **HECHO** (2026-07-07) — Gamificación: 20 FitCoins automáticos por asistencia a clase grupal                                                                                                                                                                                                                      | 🟢 BAJA   | API                | 0.5  |
| Y-10 | ✅ **HECHO** (2026-07-07) — Sesiones PT individuales (1-a-1): reutiliza `Appointment` (`appointment_type=TRAINING`) — miembro solicita trainer+horario (PENDING = sala de espera), trainer confirma/rechaza; check-in/no-show + 25 FitCoins por asistencia; UI en mobile explica la diferencia grupal vs. individual | 🟡 MEDIA  | API + Web + Mobile | 4    |
| Y-11 | ✅ **HECHO** (2026-07-07) — Canal Telegram: bot único compartido por la plataforma (`TELEGRAM_BOT_TOKEN`), vinculación de cuenta con código de 6 dígitos vía `/start CODIGO`, reutiliza `CrmService.ariaChat` para responder — el historial de conversación con ARIA es compartido entre web chat y Telegram         | 🟡 MEDIA  | API + Mobile       | 2.5  |

> **Pendiente explícito (fuera de este batch, a pedido del usuario):** DTE El Salvador, firma de contrato digital, notificaciones SMS/Email.
>
> **Nota de despliegue:** ✅ migraciones `20260706120000_coupons`, `20260707100000_class_checkin` y `20260707120000_appointment_checkin` aplicadas en Supabase (2026-07-07, `npx prisma migrate deploy` corrido por el usuario). Pendiente: `20260707140000_telegram_links`.

---

## FASE 3 — SCALE (Meses 8–16)

### Sprint 3.1 — Robustez y Performance Base (Meses 8–10)

> Multi-sede UI consolidada, Biometría facial, Salto KS y Kisi-edge **movidos a Sprint 4.A/4.B** para análisis técnico extenso.

| ID    | Tarea                                                                                        | Días |
| ----- | -------------------------------------------------------------------------------------------- | ---- |
| S3-01 | Locations schema base (`locations`, `member_locations`) — backend ready, sin UI completa aún | 3    |
| S3-02 | Permisos por sede en RBAC (filtrado de queries por location_id)                              | 2    |
| S3-03 | Atribución correcta de revenue/acceso por sede (analytics base)                              | 2    |
| S3-04 | Migración soft de gyms existentes a esquema multi-sede (1 sede por defecto)                  | 1    |
| S3-05 | Health check + observabilidad: Sentry profiling, Axiom logs estructurados                    | 2    |
| S3-06 | Backups automatizados pg_dump diarios + restore drill mensual                                | 2    |
| S3-07 | Rate limiting granular por endpoint y tenant (TD-08)                                         | 2    |
| S3-08 | Tests unitarios faltantes: BillingService + RiskScoreEngine (TD-04)                          | 3    |

### Sprint 3.2 — Microservices Selectivos & Performance (Meses 10–12)

| ID    | Tarea                                                        | Días |
| ----- | ------------------------------------------------------------ | ---- |
| S3-09 | Extraer Notification Service a microservicio independiente   | 5    |
| S3-10 | Extraer AI Service (ARIA/ZEUS) a microservicio independiente | 5    |
| S3-11 | API Gateway: authn, rate limiting, routing a microservicios  | 4    |
| S3-12 | Migración a AWS ECS Fargate + RDS PostgreSQL + ElastiCache   | 7    |
| S3-13 | Auto-scaling basado en métricas de carga (ALB + CloudWatch)  | 3    |
| S3-14 | Database sharding strategy para gyms de alto volumen         | 5    |
| S3-15 | CDN caching avanzado: imágenes y assets estáticos            | 2    |
| S3-16 | Load testing: 5,000 membr concurrentes con Locust/k6         | 3    |

### Sprint 3.3 — BI Avanzado & Data (Meses 12–14)

| ID    | Tarea                                                          | Días |
| ----- | -------------------------------------------------------------- | ---- |
| S3-17 | Data warehouse: transaccional → warehouse ETL diario           | 7    |
| S3-18 | ML churn prediction: modelo entrenado con historial de señales | 5    |
| S3-19 | Revenue forecasting: modelo de proyección a 30/60/90 días      | 4    |
| S3-20 | LTV personalizado: cálculo por segmento y gym                  | 3    |
| S3-21 | API pública de analytics para integraciones externas           | 4    |
| S3-22 | Embeddable widgets: reportes embebidos en web del gym          | 3    |

### Sprint 3.4 — Integraciones Enterprise & QA Scale (Meses 14–16)

| ID    | Tarea                                               | Días |
| ----- | --------------------------------------------------- | ---- |
| S3-23 | HID enterprise access control integration           | 7    |
| S3-24 | Brivo cloud access control                          | 5    |
| S3-25 | QuickBooks Online sync automático (webhooks)        | 4    |
| S3-26 | Xero sync                                           | 3    |
| S3-27 | Conciliación bancaria automática (Open Banking API) | 5    |
| S3-28 | SOC 2 Type I audit preparation                      | 10   |
| S3-29 | Penetration testing profesional                     | 5    |
| S3-30 | Disaster recovery: RTO < 1h, RPO < 15min            | 5    |

**Entregable Scale:** Plataforma production-grade para gyms grandes (500–3000 miembros), multi-sede, con IA biométrica y analytics avanzado.

---

## FASE 4 — ENTERPRISE & DIFERIDOS (Meses 16+)

> Sprints de alta complejidad técnica, hardware externo o regulatorios. Mantenidos fuera de MVP/Growth/Scale por requerir investigación de viabilidad, contratos con terceros y/o pruebas extensas en gyms reales antes de generalizarse.

### Sprint 4.A — Control de Acceso IoT P2 (Meses 16–18)

> Movido desde Sprint 2.7. Requiere hardware (Raspberry Pi + lectores NFC) y contrato con Kisi.

| ID    | Tarea                                                                           | Días |
| ----- | ------------------------------------------------------------------------------- | ---- |
| S4-01 | Spike técnico: comparar Kisi API vs. Brivo vs. solución propia con Raspberry Pi | 3    |
| S4-02 | Edge runtime en Raspberry Pi 4: cache de credenciales 2h offline, sync 30s      | 5    |
| S4-03 | MQTT broker (Mosquitto) — protocolo controlador ↔ backend                       | 3    |
| S4-04 | NFC MIFARE DESFire EV3: emisión de credenciales AES-128, revocación             | 4    |
| S4-05 | BLE access: rotating keys 15min, RSSI validation para evitar relay attacks      | 3    |
| S4-06 | Kisi API integration: panel de configuración y mapeo de puertas                 | 3    |
| S4-07 | Hardware sourcing y deployment guide para gyms (BOM + instalación)              | 2    |
| S4-08 | Piloto en 1 gym real durante 30 días + iteración basada en métricas             | 5    |

### Sprint 4.B — Reconocimiento Facial & Multi-Sede UI (Meses 18–20)

> Movido desde Sprint 3.1. Requiere validación legal GDPR Art.9 y testing extenso de liveness.

| ID    | Tarea                                                                          | Días |
| ----- | ------------------------------------------------------------------------------ | ---- |
| S4-09 | Spike: comparar InsightFace local vs. AWS Rekognition vs. Azure Face           | 3    |
| S4-10 | Facial Recognition: InsightFace deployment en edge (Raspberry Pi 4)            | 5    |
| S4-11 | Enrollment facial: captura, generación 512-dim embedding, pgvector             | 3    |
| S4-12 | Validación en tiempo real: comparación embedding <100ms local                  | 3    |
| S4-13 | Liveness detection: anti-spoofing (foto plana vs. rostro real con profundidad) | 5    |
| S4-14 | GDPR Art.9 compliance: consentimiento, revocación, auto-delete al cancelar     | 3    |
| S4-15 | Integración Salto KS: control de puertas avanzado                              | 3    |
| S4-16 | Panel multi-sede UI consolidado: vista unificada de todas las locations        | 4    |
| S4-17 | Membresía cross-sede: políticas de acceso entre sedes del mismo gym            | 2    |

### Sprint 4.C — DTE Multi-país (Meses 19–22)

> Cada país requiere certificación, sandbox del fisco y proveedor autorizado. Roll-out por país conforme la expansión comercial (ver `Estrategia_Comercial_GoToMarket.md` §7).

| ID    | Tarea                                                                                   | Días |
| ----- | --------------------------------------------------------------------------------------- | ---- |
| S4-18 | Refactor del módulo de facturación a arquitectura plug-in por país                      | 4    |
| S4-19 | DTE El Salvador real (Ministerio de Hacienda) — finalizar y certificar                  | 5    |
| S4-20 | DTE Guatemala (FEL — Factura Electrónica en Línea, SAT)                                 | 7    |
| S4-21 | DTE Costa Rica (Hacienda Digital, Ministerio de Hacienda CR)                            | 7    |
| S4-22 | DTE México (CFDI 4.0 — Comprobante Fiscal Digital por Internet, SAT)                    | 10   |
| S4-23 | DTE Colombia (Facturación electrónica DIAN)                                             | 7    |
| S4-24 | Tests E2E por país con datos de prueba del sandbox de cada fisco                        | 5    |
| S4-25 | Mapeo de pasarelas locales: VisaNet Guatemala, SINPE CR, OXXO/SPEI México, PSE Colombia | 4    |

### Hitos Enterprise (Meses 20+)

| Hito                         | Descripción                                                                        | Timeline |
| ---------------------------- | ---------------------------------------------------------------------------------- | -------- |
| White-label total            | Dominio, colores, marca, nombre de agentes IA configurables, publicación en stores | M20–M22  |
| API pública REST             | Developers externos pueden construir sobre GymApp                                  | M21–M23  |
| Marketplace de integraciones | Partners pueden publicar integraciones                                             | M22–M24  |
| Data lake                    | Datos históricos en S3 + Athena queries                                            | M22–M26  |
| AI-generated insights        | Reportes automáticos semanales con recomendaciones                                 | M23–M25  |
| Mobile SDK para cadenas      | Gyms pueden embeber la app en su propia app                                        | M24–M28  |
| Franchising module           | Gestión de cadenas con múltiples franquiciados                                     | M24–M28  |
| HID enterprise / Brivo cloud | Control de acceso enterprise grade                                                 | M25–M28  |

---

## MÉTRICAS DE ÉXITO POR FASE

### MVP

- [ ] Primer gym de pago activo
- [ ] Flujo de cobro exitoso > 95%
- [ ] Control de acceso QR < 500ms latencia
- [ ] 0 incidents de seguridad en pagos

### Growth

- [ ] 10+ gyms activos
- [ ] ARIA resuelve > 80% de consultas sin escalada humana
- [ ] Marketplace con > 50 productos por gym
- [ ] Gamificación: > 60% de miembros activos en programa de puntos

### Scale

- [ ] 50+ gyms activos
- [ ] Uptime 99.9% (SLA)
- [ ] < 100ms P99 para validación de acceso
- [ ] MRR propio del SaaS > $10,000

### Enterprise & Diferidos

- [ ] Primer gym con Control de Acceso IoT P2 (Kisi/NFC) en producción real
- [ ] Primer gym con Reconocimiento facial funcionando (con consentimiento GDPR)
- [ ] DTE certificado en al menos 2 países distintos (ES + 1 más)
- [ ] Primer contrato white-label
- [ ] API pública con 3+ integraciones de partners
- [ ] NPS del producto > 50

---

## DEUDA TÉCNICA PREVISTA

| Item  | Descripción                                               | Prioridad | Fase de resolución |
| ----- | --------------------------------------------------------- | --------- | ------------------ |
| TD-01 | Monolito a microservicios (Notifications + AI)            | Alta      | P3 Sprint 3.2      |
| TD-02 | Railway a AWS (mayor control, menor costo en escala)      | Alta      | P3 Sprint 3.2      |
| TD-03 | Prisma → SQL nativo en hot paths de billing               | Media     | P3                 |
| TD-04 | Tests unitarios en BillingService y RiskScoreEngine       | Alta      | Continuo           |
| TD-05 | Documentación técnica de arquitectura (diagramas C4)      | Media     | P2                 |
| TD-06 | Optimización pgvector HNSW index para escala              | Media     | P3                 |
| TD-07 | Mobile bundle size optimization (lazy loading de módulos) | Baja      | P3                 |
| TD-08 | Rate limiting granular por endpoint y por tenant          | Media     | P2                 |

---

_Plan de Trabajo — GymApp_
_Versión: 1.0 — Junio 2026_
_Próxima revisión: Al completar MVP_
