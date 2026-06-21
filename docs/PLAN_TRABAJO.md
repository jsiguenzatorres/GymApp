# Plan de Trabajo — GymApp
## App Integral de Gimnasio de Élite

> Actualizado: Junio 2026 | Estado: Planificación

---

## RESUMEN DE FASES

| Fase | Duración | Objetivo | Entregable |
|------|----------|----------|-----------|
| **Fase 0** | Semanas 1–2 | Scaffolding del monorepo | Repo funcional, CI/CD, DB conectada |
| **MVP (Fase 1)** | Meses 1–4 | Producto mínimo vendible | Membresías + Billing + Acceso QR + Workout básico + CRM + Analytics |
| **Growth (Fase 2)** | Meses 4–8 | Expansión de funcionalidades | Marketplace + Gamificación + IA completa + Nutrición + IoT |
| **Scale (Fase 3)** | Meses 8–16 | Escala y robustez | Multi-sede + Biometría + BI avanzado + Microservices selectivos |
| **Enterprise (Fase 4)** | Meses 16+ | Mercado enterprise | White-label + HID enterprise + API pública + Data lake |

---

## FASE 0 — SCAFFOLDING (Semanas 1–2)

### Sprint 0.1 (Semana 1)

**Objetivo:** Monorepo, CI/CD y base de datos funcionales

#### Tareas

| ID | Tarea | Responsable | Días | Dependencias |
|----|-------|------------|------|-------------|
| S0-01 | Inicializar Turborepo con apps/api, apps/web, apps/mobile, packages/* | Dev | 1 | — |
| S0-02 | Configurar TypeScript strict mode en todos los packages | Dev | 0.5 | S0-01 |
| S0-03 | Setup ESLint + Prettier + Husky pre-commit hooks | Dev | 0.5 | S0-01 |
| S0-04 | Crear proyecto en Railway.app (staging + production) | Dev | 0.5 | — |
| S0-05 | Provisionar PostgreSQL 16 en Railway con extensiones requeridas | Dev | 0.5 | S0-04 |
| S0-06 | Provisionar Redis (Upstash) | Dev | 0.5 | S0-04 |
| S0-07 | Configurar Doppler (staging, production, development) | Dev | 1 | — |
| S0-08 | GitHub repo: `git@github-js:jsiguenzatorres/GymApp.git` | Dev | 0.5 | S0-01 |
| S0-09 | GitHub Actions CI: lint + build + test en PR | Dev | 1 | S0-02, S0-08 |
| S0-10 | GitHub Actions CD: auto-deploy a Railway en merge a main | Dev | 1 | S0-09 |

### Sprint 0.2 (Semana 2)

**Objetivo:** NestJS skeleton con multi-tenancy y auth skeleton

| ID | Tarea | Días |
|----|-------|------|
| S0-11 | NestJS 11: módulos base (app, config, database, health) | 1 |
| S0-12 | Prisma setup: schema inicial (gyms, users, staff, members) | 1 |
| S0-13 | TenantMiddleware: extracción gym_id de JWT y header | 0.5 |
| S0-14 | RLS setup: activar en tablas gyms, staff, members | 0.5 |
| S0-15 | JWT auth skeleton (login, refresh, logout) | 1 |
| S0-16 | RBAC Guards: @Roles decorator + RolesGuard | 0.5 |
| S0-17 | Next.js 15 App Router skeleton con layout y auth pages | 1 |
| S0-18 | Expo React Native skeleton con Expo Router + auth flow | 1 |
| S0-19 | Cloudflare R2: bucket config + upload service util | 0.5 |
| S0-20 | Sentry integration en api, web y mobile | 0.5 |

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

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-01 | Auth completo: registro, login, refresh token, logout | 2 | AUTH |
| M1-02 | 2FA TOTP: setup, verify, backup codes | 1 | AUTH |
| M1-03 | Password reset flow (email token) | 1 | AUTH |
| M1-04 | Onboarding del gym: wizard de configuración inicial | 2 | GYMS |
| M1-05 | Gestión de staff: invite, roles, desactivar | 2 | STAFF |
| M1-06 | Perfil del gym: logo, horarios, redes sociales, políticas | 1 | GYMS |
| M1-07 | Gestión de sedes (multi-sede básico para Phase 3) | 1 | GYMS |
| M1-08 | Web: páginas de auth (login, forgot password, 2FA) | 2 | AUTH/WEB |
| M1-09 | Web: wizard de onboarding del gym | 2 | GYMS/WEB |
| M1-10 | Web: CRUD de staff con invitación por email | 2 | STAFF/WEB |

### Sprint 1.2 — Membresías Core (Semanas 5–6)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-11 | Prisma schema: membership_types, memberships, member_wallets | 1 | MEM |
| M1-12 | CRUD catálogo de planes (membership_types) | 2 | MEM |
| M1-13 | Alta de miembro: flujo de 7 pasos con foto y PAR-Q | 2 | MEM |
| M1-14 | Contrato digital: firma + OTP SMS + hash SHA-256 + PDF | 2 | MEM |
| M1-15 | Máquina de estados: LEAD→TRIAL→ACTIVE→FREEZE→EXPIRED→CANCELLED | 2 | MEM |
| M1-16 | Freeze de membresía: solicitud, aprobación, extensión de fecha | 1.5 | MEM |
| M1-17 | Renovación y cancelación con período de aviso | 1.5 | MEM |
| M1-18 | Web: lista de miembros con filtros y búsqueda | 2 | MEM/WEB |
| M1-19 | Web: ficha completa del miembro (perfil, historial, docs) | 2 | MEM/WEB |
| M1-20 | Web: modal de alta rápida (recepcionista) | 1 | MEM/WEB |

### Sprint 1.3 — Billing & Pagos (Semanas 7–9)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-21 | Prisma schema: subscriptions, transactions, invoices, payment_methods | 1 | BIL |
| M1-22 | Integración Stripe: customer, payment method, subscription | 3 | BIL |
| M1-23 | Integración MercadoPago: cobros recurrentes LATAM | 3 | BIL |
| M1-24 | Motor de cobros: Subscription Engine con BullMQ | 2 | BIL |
| M1-25 | Dunning Engine: Day 0→3→5→7→14 con BullMQ | 2 | BIL |
| M1-26 | Webhook handlers: Stripe + MercadoPago (idempotente) | 2 | BIL |
| M1-27 | Facturación básica: generación de facturas PDF | 1.5 | BIL |
| M1-28 | DTE El Salvador: CF y CCF con proveedor autorizado | 2 | BIL |
| M1-29 | Wallet del miembro: saldo, recargas, aplicar en cobro | 1.5 | BIL |
| M1-30 | Cupones y descuentos: CRUD + aplicación en cobro | 1.5 | BIL |
| M1-31 | Web: dashboard financiero básico (ingresos del día/mes) | 2 | BIL/WEB |
| M1-32 | Web: gestión de métodos de pago y reintentos manuales | 1.5 | BIL/WEB |
| M1-33 | Web: historial de transacciones con filtros y export | 1.5 | BIL/WEB |

### Sprint 1.4 — Control de Acceso QR (Semanas 9–10)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-34 | Prisma schema: access_controllers, access_doors, access_logs | 1 | ACCESS |
| M1-35 | Generador de QR: payload HMAC-SHA256, TTL 60s, nonce | 1.5 | ACCESS |
| M1-36 | Validador de acceso: 8-step decision tree | 2 | ACCESS |
| M1-37 | Endpoint MQTT-over-HTTP para controlador físico | 1.5 | ACCESS |
| M1-38 | Logs de acceso: inmutables (CREATE RULE), con member snapshot | 1 | ACCESS |
| M1-39 | Aforo en tiempo real: conteo por zona | 1 | ACCESS |
| M1-40 | Visitor passes: generación y validación | 1 | ACCESS |
| M1-41 | Mobile: pantalla QR del miembro (animado, auto-refresh) | 1.5 | ACCESS/MOBILE |
| M1-42 | Web: dashboard de acceso en tiempo real | 1.5 | ACCESS/WEB |
| M1-43 | Web: log de accesos con filtros (quién, cuándo, resultado) | 1 | ACCESS/WEB |

### Sprint 1.5 — Workout Builder Básico (Semanas 11–12)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-44 | Prisma schema: exercises, training_plans, training_days, exercise_blocks, prescribed_exercises | 1.5 | WKT |
| M1-45 | Biblioteca de ejercicios: CRUD con multimedia (video/gif/foto) | 2 | WKT |
| M1-46 | Workout Builder UI: drag & drop de ejercicios en el plan | 3 | WKT/WEB |
| M1-47 | Plantillas de rutinas: crear, clonar, asignar a miembro | 2 | WKT |
| M1-48 | Asignación de planes: trainer → miembro con fecha inicio | 1 | WKT |
| M1-49 | Prisma schema: workout_sessions, executed_sets, personal_records | 1 | WKT |
| M1-50 | Mobile: pantalla de sesión activa (lista de ejercicios + timer) | 3 | WKT/MOBILE |
| M1-51 | Mobile: registro de series (peso, reps, RPE) con offline support | 2 | WKT/MOBILE |
| M1-52 | Mobile: dashboard de progreso básico (PRs, historial) | 2 | WKT/MOBILE |
| M1-53 | Web: vista del trainer — progreso de alumnos | 2 | WKT/WEB |

### Sprint 1.6 — CRM Core + Notificaciones (Semanas 13–14)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-54 | Prisma schema: members (extendido), interaction_log, member_risk_history | 1 | CRM |
| M1-55 | Risk Score engine: cálculo inicial de 12 señales con pg_cron | 3 | CRM |
| M1-56 | Pipeline de leads: LEAD→TRIAL con seguimiento | 2 | CRM |
| M1-57 | Segmentación básica: filtros por plan, nivel, actividad | 1.5 | CRM |
| M1-58 | Workflows básicos: WF-001 onboarding, WF-004 inactividad | 2 | CRM |
| M1-59 | Notification Service: email (SendGrid) + SMS (Twilio) + push (FCM) | 2 | NOTIF |
| M1-60 | Templates de notificación por canal y evento | 1.5 | NOTIF |
| M1-61 | Web: dashboard CRM — lista de miembros en riesgo | 2 | CRM/WEB |
| M1-62 | Web: ficha CRM — timeline de interacciones, score, workflows | 2 | CRM/WEB |
| M1-63 | Mobile: notificaciones push básicas | 1 | NOTIF/MOBILE |

### Sprint 1.7 — Analytics Básico + QA MVP (Semanas 15–16)

| ID | Tarea | Días | Módulo |
|----|-------|------|--------|
| M1-64 | Prisma schema: metric_snapshots, dashboard_kpis (materialized view) | 1.5 | ANALYTICS |
| M1-65 | KPIs esenciales: MRR, miembros activos, churn, ingresos del día | 2 | ANALYTICS |
| M1-66 | pg_cron: job diario de metric_snapshots a las 2:00 AM | 1 | ANALYTICS |
| M1-67 | Materialized view refresh: CONCURRENTLY cada hora | 0.5 | ANALYTICS |
| M1-68 | Web: dashboard ejecutivo — 8 KPI cards + gráfica MRR | 2 | ANALYTICS/WEB |
| M1-69 | Web: reporte de cobros fallidos + recuperación | 1.5 | ANALYTICS/WEB |
| M1-70 | QA: testing E2E del flujo crítico (alta → cobro → acceso → workout) | 3 | QA |
| M1-71 | Load testing: validar throughput de acceso QR concurrente | 1 | QA |
| M1-72 | Security audit: OWASP Top 10 básico en endpoints de pago | 1.5 | SEGURIDAD |
| M1-73 | Documentación de API (OpenAPI/Swagger) para módulos MVP | 1 | DOCS |

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

| ID | Tarea | Días |
|----|-------|------|
| G2-01 | RAG pipeline: LangChain.js + pgvector knowledge base | 3 |
| G2-02 | ARIA persona: prompt engineering + system prompt configurable | 2 |
| G2-03 | Integración WhatsApp Business API (Meta) | 2 |
| G2-04 | Integración Telegram Bot API | 1.5 |
| G2-05 | Chat en app móvil con ARIA | 2 |
| G2-06 | Flujos conversacionales: consultas, citas, renovaciones, quejas | 3 |
| G2-07 | Escalada a humano: detección de frustración + handoff al staff | 1.5 |
| G2-08 | Workflows completos: WF-002 a WF-008 | 3 |
| G2-09 | ARIA Voice: ElevenLabs TTS + Whisper STT | 2 |
| G2-10 | Rate limiting 50 queries/miembro/día | 0.5 |

### Sprint 2.2 — ZEUS AI Coach + Sustitución (Meses 4.5–5.0)

| ID | Tarea | Días |
|----|-------|------|
| G2-11 | ZEUS persona: prompt engineering + 4-layer knowledge base | 2 |
| G2-12 | ZEUS voz: comandos "Hey ZEUS" + Whisper STT + ElevenLabs TTS | 2.5 |
| G2-13 | Algoritmo de sustitución inteligente (similitud muscular ≥80%) | 2 |
| G2-14 | AI Co-Pilot para trainers: generación de planes desde descripción | 3 |
| G2-15 | Análisis de balance muscular: empuje/jale, alertas de desequilibrio | 2 |
| G2-16 | Periodización automática: linear, DUP, block, conjugate, double progression | 3 |
| G2-17 | Deload automático: detección de fatiga por métricas | 1.5 |
| G2-18 | Recovery Score: integración Apple HealthKit / Google Fit / Garmin / Oura | 3 |
| G2-19 | Motor de investigación científica: monitoreo PubMed + RSS mensual | 2 |
| G2-20 | Panel de aprobación de contenido científico (4 niveles) | 2 |

### Sprint 2.3 — Marketplace Core (Meses 5.0–5.5)

| ID | Tarea | Días |
|----|-------|------|
| G2-21 | Prisma schema: products, product_variants, inventory_movements | 1 |
| G2-22 | Catálogo de productos: CRUD con variantes, precios, stock, multimedia | 3 |
| G2-23 | Inventario: movimientos, alertas de stock mínimo, reservas 15min | 2 |
| G2-24 | Prisma schema: marketplace_orders, marketplace_order_items | 0.5 |
| G2-25 | Flujo de compra: carrito → checkout → pago → fulfillment | 3 |
| G2-26 | POS integrado: caja, turnos, efectivo, devoluciones | 2.5 |
| G2-27 | Prisma schema: member_credit_accounts, credit_account_movements | 0.5 |
| G2-28 | Sistema de crédito: límites, 5 niveles de suspensión, cobro automático | 3 |
| G2-29 | Suscripciones de productos (auto-reorden por frecuencia) | 1.5 |
| G2-30 | Wishlist + notificaciones de precio y stock | 1 |

### Sprint 2.4 — Marketplace IA + Canales Avanzados (Meses 5.5–6.0)

| ID | Tarea | Días |
|----|-------|------|
| G2-31 | ARIA ordena por voz: NLU + búsqueda semántica en catálogo | 3 |
| G2-32 | Compra por foto: Google Vision API + GPT-4o Visual → producto | 2.5 |
| G2-33 | Motor de recomendaciones IA: 7 fuentes (goal, historial, CF, etc.) | 3 |
| G2-34 | Smart combos: bundle automático por perfil + precio calculado | 2 |
| G2-35 | Caja del Mes: suscripción mensual, armado por nutricionista | 2 |
| G2-36 | Vitrina pública (sin login) con SEO y meta tags | 1.5 |
| G2-37 | Galería "Resultados con Productos" + moderación | 1 |
| G2-38 | Compra grupal: pedido compartido entre miembros | 2 |
| G2-39 | Etiquetado dietético: vegano, sin gluten, sin lactosa, etc. | 1 |
| G2-40 | Reportes marketplace: ventas, stock, crédito, canal ROI | 2 |

### Sprint 2.5 — Gamificación & Comunidad (Meses 6.0–6.5)

| ID | Tarea | Días |
|----|-------|------|
| G2-41 | Prisma schema: gamification_config, member_points, points_transactions | 1 |
| G2-42 | Motor de puntos: reglas configurables, anti-abuso, expiración | 3 |
| G2-43 | Prisma schema: badge_catalog, member_badges | 0.5 |
| G2-44 | Sistema de medallas: 14 tipos, comunes/raras/legendarias, triggers | 2.5 |
| G2-45 | Niveles de fidelidad: Bronce→Élite, beneficios por nivel | 1.5 |
| G2-46 | Prisma schema: challenges, challenge_participants | 0.5 |
| G2-47 | Challenges: individuales, grupales, gym-wide con leaderboard | 2.5 |
| G2-48 | Prisma schema: social_posts, social_reactions, social_comments | 0.5 |
| G2-49 | Feed social: posts auto y manuales, moderación, reactions | 2.5 |
| G2-50 | Buddy matching: algoritmo afinidad por goal + horario | 2 |
| G2-51 | Prisma schema: referral_links, referrals | 0.5 |
| G2-52 | Sistema de referidos: código único, tracking, recompensa automática | 2 |
| G2-53 | Prisma schema: reward_catalog, reward_redemptions | 0.5 |
| G2-54 | Tienda de recompensas: canjes de puntos por descuentos/productos | 2 |
| G2-55 | No-code Rule Engine: UI para configurar reglas de puntos sin código | 3 |

### Sprint 2.6 — Nutrición IA (Meses 6.5–7.0)

| ID | Tarea | Días |
|----|-------|------|
| G2-56 | Prisma schema: nutrition_plans, food_diary, foods_database | 1.5 |
| G2-57 | Calculadora TMB: Harris-Benedict + Mifflin-St Jeor + Katch-McArdle | 1 |
| G2-58 | Generador de plan nutricional con IA (macros, comidas, recetas) | 3 |
| G2-59 | Base de datos de alimentos: USDA + alimentos locales LATAM | 2 |
| G2-60 | Registro de comidas: búsqueda, escaneo de código de barras, foto | 2.5 |
| G2-61 | Análisis nutricional del carrito de marketplace | 1.5 |
| G2-62 | Integración ZEUS ↔ Nutrición: ajuste calórico post-sesión | 1.5 |
| G2-63 | Web: panel del nutricionista con todos sus pacientes | 2 |
| G2-64 | Mobile: pantalla de nutrición diaria + macros + registro | 2.5 |

### Sprint 2.7 — Clases, Horarios, Feedback & Control Acceso P2 (Meses 7.0–7.5)

| ID | Tarea | Días |
|----|-------|------|
| G2-65 | Módulo de clases: horarios, instructores, capacidad, inscripción | 3 |
| G2-66 | Reservas de clases: lista de espera, cancelación, notificaciones | 2 |
| G2-67 | Web: calendario de clases (FullCalendar) con drag & drop | 2 |
| G2-68 | Mobile: explorar y reservar clases | 2 |
| G2-69 | Feedback & NPS: encuestas post-clase, post-visita, NPS mensual | 2 |
| G2-70 | Control de acceso P2: MQTT + Raspberry Pi edge + BullMQ sync | 3 |
| G2-71 | NFC MIFARE DESFire EV3: credenciales AES-128, emisión, revocación | 3 |
| G2-72 | BLE access: rotating keys 15min, RSSI validation | 2 |
| G2-73 | Kisi API integration: control de puertas inteligentes | 2 |

### Sprint 2.8 — Analytics Full + Blog + QA Growth (Meses 7.5–8.0)

| ID | Tarea | Días |
|----|-------|------|
| G2-74 | Business Coach IA: queries en lenguaje natural al dashboard | 3 |
| G2-75 | Análisis de cohortes: retención mensual por cohorte | 2 |
| G2-76 | Churn radar: top 10 miembros en riesgo con score detallado | 1.5 |
| G2-77 | 25+ reportes del catálogo: financiero, membresías, acceso, workout | 4 |
| G2-78 | Exportación de reportes: PDF, Excel, CSV | 1.5 |
| G2-79 | Alert rules: configuración de alertas por umbral (MRR caída, churn pico) | 2 |
| G2-80 | Blog & contenido: editor Tiptap, categorías, SEO, moderación | 3 |
| G2-81 | QA: testing integración ARIA + Marketplace + Gamificación | 3 |
| G2-82 | Performance testing: 500 membr concurrentes, QR y payments | 2 |
| G2-83 | Documentación API Growth (OpenAPI actualizado) | 1 |

**Entregable Growth:** Sistema completo con IA conversacional, marketplace, gamificación y nutrición. Producto diferenciado en el mercado LATAM.

---

## FASE 3 — SCALE (Meses 8–16)

### Sprint 3.1 — Multi-Sede & Biometría Facial (Meses 8–10)

| ID | Tarea | Días |
|----|-------|------|
| S3-01 | Multi-sede: schema `locations`, permisos por sede, membresía cross-sede | 5 |
| S3-02 | Facial Recognition: InsightFace setup en edge (Raspberry Pi 4) | 5 |
| S3-03 | Enrollment facial: captura, generación 512-dim embedding, pgvector | 3 |
| S3-04 | Validación facial en tiempo real: comparación embedding <100ms local | 3 |
| S3-05 | Liveness detection: anti-spoofing (foto vs. rostro real) | 3 |
| S3-06 | GDPR Art.9: flujo de consentimiento, revocación, auto-delete | 2 |
| S3-07 | Integración Salto KS: control de puertas avanzado | 3 |
| S3-08 | Panel multi-sede: vista unificada de todos los locales | 3 |

### Sprint 3.2 — Microservices Selectivos & Performance (Meses 10–12)

| ID | Tarea | Días |
|----|-------|------|
| S3-09 | Extraer Notification Service a microservicio independiente | 5 |
| S3-10 | Extraer AI Service (ARIA/ZEUS) a microservicio independiente | 5 |
| S3-11 | API Gateway: authn, rate limiting, routing a microservicios | 4 |
| S3-12 | Migración a AWS ECS Fargate + RDS PostgreSQL + ElastiCache | 7 |
| S3-13 | Auto-scaling basado en métricas de carga (ALB + CloudWatch) | 3 |
| S3-14 | Database sharding strategy para gyms de alto volumen | 5 |
| S3-15 | CDN caching avanzado: imágenes y assets estáticos | 2 |
| S3-16 | Load testing: 5,000 membr concurrentes con Locust/k6 | 3 |

### Sprint 3.3 — BI Avanzado & Data (Meses 12–14)

| ID | Tarea | Días |
|----|-------|------|
| S3-17 | Data warehouse: transaccional → warehouse ETL diario | 7 |
| S3-18 | ML churn prediction: modelo entrenado con historial de señales | 5 |
| S3-19 | Revenue forecasting: modelo de proyección a 30/60/90 días | 4 |
| S3-20 | LTV personalizado: cálculo por segmento y gym | 3 |
| S3-21 | API pública de analytics para integraciones externas | 4 |
| S3-22 | Embeddable widgets: reportes embebidos en web del gym | 3 |

### Sprint 3.4 — Integraciones Enterprise & QA Scale (Meses 14–16)

| ID | Tarea | Días |
|----|-------|------|
| S3-23 | HID enterprise access control integration | 7 |
| S3-24 | Brivo cloud access control | 5 |
| S3-25 | QuickBooks Online sync automático (webhooks) | 4 |
| S3-26 | Xero sync | 3 |
| S3-27 | Conciliación bancaria automática (Open Banking API) | 5 |
| S3-28 | SOC 2 Type I audit preparation | 10 |
| S3-29 | Penetration testing profesional | 5 |
| S3-30 | Disaster recovery: RTO < 1h, RPO < 15min | 5 |

**Entregable Scale:** Plataforma production-grade para gyms grandes (500–3000 miembros), multi-sede, con IA biométrica y analytics avanzado.

---

## FASE 4 — ENTERPRISE (Meses 16+)

### Hitos Enterprise

| Hito | Descripción | Timeline |
|------|------------|---------|
| White-label total | Dominio, colores, marca, nombre de agentes IA configurables | M16–M18 |
| API pública REST | Developers externos pueden construir sobre GymApp | M17–M19 |
| Marketplace de integraciones | Partners pueden publicar integraciones | M18–M20 |
| Data lake | Datos históricos en S3 + Athena queries | M18–M22 |
| AI-generated insights | Reportes automáticos semanales con recomendaciones | M19–M21 |
| Mobile SDK para cadenas | Gyms pueden embeber la app en su propia app | M20–M24 |
| Franchising module | Gestión de cadenas con múltiples franquiciados | M20–M24 |

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

### Enterprise
- [ ] Primer contrato white-label
- [ ] API pública con 3+ integraciones de partners
- [ ] NPS del producto > 50

---

## DEUDA TÉCNICA PREVISTA

| Item | Descripción | Prioridad | Fase de resolución |
|------|------------|-----------|-------------------|
| TD-01 | Monolito a microservicios (Notifications + AI) | Alta | P3 Sprint 3.2 |
| TD-02 | Railway a AWS (mayor control, menor costo en escala) | Alta | P3 Sprint 3.2 |
| TD-03 | Prisma → SQL nativo en hot paths de billing | Media | P3 |
| TD-04 | Tests unitarios en BillingService y RiskScoreEngine | Alta | Continuo |
| TD-05 | Documentación técnica de arquitectura (diagramas C4) | Media | P2 |
| TD-06 | Optimización pgvector HNSW index para escala | Media | P3 |
| TD-07 | Mobile bundle size optimization (lazy loading de módulos) | Baja | P3 |
| TD-08 | Rate limiting granular por endpoint y por tenant | Media | P2 |

---

*Plan de Trabajo — GymApp*
*Versión: 1.0 — Junio 2026*
*Próxima revisión: Al completar MVP*
